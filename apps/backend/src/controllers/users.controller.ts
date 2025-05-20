import { Request, Response } from 'express';
import { DatabaseService } from '../services/db.service';
import { asyncHandler, createError } from '../middlewares/error.middleware';

const prisma = DatabaseService.getInstance().getPrisma();

export class UsersController {
  getUserProfile = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const currentUserId = req.user?.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        avatar: true,
        createdAt: true,
        _count: {
          select: {
            tactics: true,
            likes: true,
            // followers: true,
            // following: true,
          },
        },
      },
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    // Check if current user follows this user (for future)
    const isFollowing = false;
    if (currentUserId && currentUserId !== userId) {
      // TODO: Implement follow system
      // const follow = await prisma.follow.findUnique({
      //   where: {
      //     followerId_followingId: {
      //       followerId: currentUserId,
      //       followingId: userId
      //     }
      //   }
      // });
      // isFollowing = !!follow;
    }

    res.json({
      success: true,
      data: {
        ...user,
        isFollowing,
        stats: {
          tacticsCount: user._count.tactics,
          likesReceived: user._count.likes,
          // followersCount: user._count.followers,
          // followingCount: user._count.following,
        },
      },
    });
  });

  // Get user's tactics
  getUserTactics = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const currentUserId = req.user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const sortBy = (req.query.sortBy as string) || 'recent';
    const skip = (page - 1) * limit;

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    // Sort options
    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'popular') {
      orderBy = { likes: { _count: 'desc' } };
    } else if (sortBy === 'oldest') {
      orderBy = { createdAt: 'asc' };
    }

    const [tactics, total] = await Promise.all([
      prisma.tactic.findMany({
        where: { authorId: userId },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
              saves: true,
            },
          },
          ...(currentUserId && {
            likes: {
              where: { userId: currentUserId },
              select: { userId: true },
            },
            saves: {
              where: { userId: currentUserId },
              select: { userId: true },
            },
          }),
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.tactic.count({
        where: { authorId: userId },
      }),
    ]);

    // Transform response to include user interaction flags
    const tacticsWithInteractions = tactics.map((tactic: any) => ({
      id: tactic.id,
      title: tactic.title,
      formation: tactic.formation,
      tags: tactic.tags,
      description: tactic.description,
      createdAt: tactic.createdAt,
      updatedAt: tactic.updatedAt,
      author: tactic.author,
      stats: {
        likes: tactic._count.likes,
        comments: tactic._count.comments,
        saves: tactic._count.saves,
      },
      ...(currentUserId && {
        isLiked: tactic.likes?.length > 0,
        isSaved: tactic.saves?.length > 0,
        canEdit: tactic.authorId === currentUserId,
      }),
    }));

    res.json({
      success: true,
      data: {
        tactics: tacticsWithInteractions,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          count: tactics.length,
          totalItems: total,
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      },
    });
  });

  // Get user's statistics
  getUserStats = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, createdAt: true },
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    // Get comprehensive stats
    const [tacticsStats, interactionStats] = await Promise.all([
      // Tactics created by user
      prisma.tactic.aggregate({
        where: { authorId: userId },
        _count: { id: true },
      }),
      // Interactions on user's tactics
      prisma.tactic.findMany({
        where: { authorId: userId },
        select: {
          _count: {
            select: {
              likes: true,
              comments: true,
              saves: true,
            },
          },
        },
      }),
    ]);

    // Calculate total interactions
    const totalLikes = interactionStats.reduce((sum, tactic: any) => sum + tactic._count.likes, 0);
    const totalComments = interactionStats.reduce(
      (sum, tactic: any) => sum + tactic._count.comments,
      0,
    );
    const totalSaves = interactionStats.reduce((sum, tactic: any) => sum + tactic._count.saves, 0);

    // Get popular formations used by user
    const formationStats = await prisma.tactic.groupBy({
      by: ['formation'],
      where: { authorId: userId },
      _count: { formation: true },
      orderBy: { _count: { formation: 'desc' } },
      take: 5,
    });

    // Get monthly activity (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyActivity = await prisma.tactic.groupBy({
      by: ['createdAt'],
      where: {
        authorId: userId,
        createdAt: { gte: sixMonthsAgo },
      },
      _count: { id: true },
      orderBy: { createdAt: 'asc' },
    });

    res.json({
      success: true,
      data: {
        overview: {
          tacticsCreated: tacticsStats._count.id,
          totalLikes: totalLikes,
          totalComments: totalComments,
          totalSaves: totalSaves,
          memberSince: user.createdAt,
        },
        formations: formationStats.map(stat => ({
          formation: stat.formation,
          count: stat._count.formation,
        })),
        activity: monthlyActivity,
        averageEngagement:
          tacticsStats._count.id > 0
            ? Math.round(
                ((totalLikes + totalComments + totalSaves) / tacticsStats._count.id) * 100,
              ) / 100
            : 0,
      },
    });
  });

  // Get current user's saved tactics
  getSavedTactics = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const skip = (page - 1) * limit;

    const [savedTactics, total] = await Promise.all([
      prisma.save.findMany({
        where: { userId },
        include: {
          tactic: {
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  avatar: true,
                },
              },
              _count: {
                select: {
                  likes: true,
                  comments: true,
                  saves: true,
                },
              },
              likes: {
                where: { userId },
                select: { userId: true },
              },
            },
          },
        },
        orderBy: { savedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.save.count({ where: { userId } }),
    ]);

    const tactics = savedTactics.map(save => ({
      ...save.tactic,
      stats: {
        likes: save.tactic._count.likes,
        comments: save.tactic._count.comments,
        saves: save.tactic._count.saves,
      },
      isLiked: save.tactic.likes.length > 0,
      isSaved: true,
      canEdit: save.tactic.authorId === userId,
      savedAt: save.savedAt,
    }));

    res.json({
      success: true,
      data: {
        tactics,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          count: tactics.length,
          totalItems: total,
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      },
    });
  });

  // Get current user's liked tactics
  getLikedTactics = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const skip = (page - 1) * limit;

    const [likedTactics, total] = await Promise.all([
      prisma.like.findMany({
        where: { userId },
        include: {
          tactic: {
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  avatar: true,
                },
              },
              _count: {
                select: {
                  likes: true,
                  comments: true,
                  saves: true,
                },
              },
              saves: {
                where: { userId },
                select: { userId: true },
              },
            },
          },
        },
        orderBy: { tactic: { createdAt: 'desc' } },
        skip,
        take: limit,
      }),
      prisma.like.count({ where: { userId } }),
    ]);

    const tactics = likedTactics.map(like => ({
      ...like.tactic,
      stats: {
        likes: like.tactic._count.likes,
        comments: like.tactic._count.comments,
        saves: like.tactic._count.saves,
      },
      isLiked: true,
      isSaved: like.tactic.saves.length > 0,
      canEdit: like.tactic.authorId === userId,
    }));

    res.json({
      success: true,
      data: {
        tactics,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          count: tactics.length,
          totalItems: total,
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      },
    });
  });

  // Get current user's analytics
  getUserAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const timeRange = (req.query.timeRange as string) || '30d';

    // Calculate date range
    const now = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get analytics data
    const [totalTactics, recentEngagement, topTactics, formationBreakdown] = await Promise.all([
      // Total tactics count
      prisma.tactic.count({ where: { authorId: userId } }),

      // Recent engagement on user's tactics
      prisma.tactic.findMany({
        where: {
          authorId: userId,
          OR: [
            { likes: { some: { tactic: { createdAt: { gte: startDate } } } } },
            { comments: { some: { createdAt: { gte: startDate } } } },
            { saves: { some: { savedAt: { gte: startDate } } } },
          ],
        },
        select: {
          id: true,
          title: true,
          _count: {
            select: {
              likes: true,
              comments: true,
              saves: true,
            },
          },
        },
      }),

      // Top performing tactics
      prisma.tactic.findMany({
        where: { authorId: userId },
        select: {
          id: true,
          title: true,
          formation: true,
          createdAt: true,
          _count: {
            select: {
              likes: true,
              comments: true,
              saves: true,
            },
          },
        },
        orderBy: {
          likes: { _count: 'desc' },
        },
        take: 5,
      }),

      // Formation breakdown
      prisma.tactic.groupBy({
        by: ['formation'],
        where: { authorId: userId },
        _count: { formation: true },
        orderBy: { _count: { formation: 'desc' } },
      }),
    ]);

    // Calculate engagement metrics
    const totalEngagement = recentEngagement.reduce(
      (sum, tactic) => sum + tactic._count.likes + tactic._count.comments + tactic._count.saves,
      0,
    );

    res.json({
      success: true,
      data: {
        overview: {
          totalTactics,
          totalEngagement,
          averageEngagement:
            totalTactics > 0 ? Math.round((totalEngagement / totalTactics) * 100) / 100 : 0,
          timeRange,
        },
        topTactics: topTactics.map(tactic => ({
          id: tactic.id,
          title: tactic.title,
          formation: tactic.formation,
          createdAt: tactic.createdAt,
          engagement: tactic._count.likes + tactic._count.comments + tactic._count.saves,
          likes: tactic._count.likes,
          comments: tactic._count.comments,
          saves: tactic._count.saves,
        })),
        formations: formationBreakdown.map(item => ({
          formation: item.formation,
          count: item._count.formation,
          percentage: Math.round((item._count.formation / totalTactics) * 100),
        })),
      },
    });
  });

  // Get current user's activity feed
  getUserActivity = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Get recent likes on user's tactics
    const recentLikes = await prisma.like.findMany({
      where: { tactic: { authorId: userId } },
      include: {
        user: {
          select: { id: true, username: true, avatar: true },
        },
        tactic: {
          select: { id: true, title: true },
        },
      },
      orderBy: { tactic: { createdAt: 'desc' } },
      take: limit,
    });

    // Get recent comments on user's tactics
    const recentComments = await prisma.comment.findMany({
      where: { tactic: { authorId: userId } },
      include: {
        user: {
          select: { id: true, username: true, avatar: true },
        },
        tactic: {
          select: { id: true, title: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Combine and sort activities
    const activities = [
      ...recentLikes.map(like => ({
        type: 'like' as const,
        id: `like-${like.user.id}-${like.tactic.id}`,
        user: like.user,
        tactic: like.tactic,
        createdAt: like.tactic.createdAt, // Using tactic creation date as proxy
      })),
      ...recentComments.map(comment => ({
        type: 'comment' as const,
        id: `comment-${comment.id}`,
        user: comment.user,
        tactic: comment.tactic,
        content: comment.content.substring(0, 100) + (comment.content.length > 100 ? '...' : ''),
        createdAt: comment.createdAt,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({
      success: true,
      data: {
        activities: activities.slice(skip, skip + limit),
        pagination: {
          current: page,
          hasNext: activities.length > skip + limit,
          hasPrev: page > 1,
        },
      },
    });
  });

  // Follow user (placeholder for future implementation)
  followUser = asyncHandler(async (req: Request, res: Response) => {
    // TODO: Implement follow system
    res.status(501).json({
      success: false,
      error: 'Follow system not implemented yet',
    });
  });

  // Unfollow user (placeholder for future implementation)
  unfollowUser = asyncHandler(async (req: Request, res: Response) => {
    // TODO: Implement follow system
    res.status(501).json({
      success: false,
      error: 'Follow system not implemented yet',
    });
  });

  // Get followers (placeholder for future implementation)
  getFollowers = asyncHandler(async (req: Request, res: Response) => {
    // TODO: Implement follow system
    res.status(501).json({
      success: false,
      error: 'Follow system not implemented yet',
    });
  });

  // Get following (placeholder for future implementation)
  getFollowing = asyncHandler(async (req: Request, res: Response) => {
    // TODO: Implement follow system
    res.status(501).json({
      success: false,
      error: 'Follow system not implemented yet',
    });
  });
}
