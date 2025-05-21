import { TacticResponse, Player, TacticFormData, TacticFilters } from '@the-offside-trap/shared';
import { prisma } from './db.service';
import { createError } from '../middlewares/error.middleware';

export class TacticsService {
  /**
   * Get tactics with filtering, sorting, and pagination
   */
  async getTactics(filters?: TacticFilters, userId?: string) {
    const {
      formation,
      tags,
      search,
      sortBy = 'recent',
      timeRange,
      page = 1,
      limit = 12,
    } = filters || {};

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Filter by formation
    if (formation) {
      where.formation = formation;
    }

    // Filter by tags (array contains)
    if (tags && tags.length > 0) {
      where.tags = {
        hasSome: tags,
      };
    }

    // Full-text search
    if (search && search.trim() !== '') {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ];
    }

    // Time range filter
    if (timeRange) {
      const now = new Date();
      let dateFilter: Date;

      switch (timeRange) {
        case '1d':
          dateFilter = new Date(now.setDate(now.getDate() - 1));
          break;
        case '1w':
          dateFilter = new Date(now.setDate(now.getDate() - 7));
          break;
        case '1m':
          dateFilter = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case '1y':
          dateFilter = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        default:
          dateFilter = new Date(0); // All time
      }

      where.createdAt = {
        gte: dateFilter,
      };
    }

    // Sorting options
    let orderBy: any;
    switch (sortBy) {
      case 'recent':
        orderBy = { createdAt: 'desc' };
        break;
      case 'popular':
        orderBy = { likes: { _count: 'desc' } };
        break;
      case 'trending':
        // Complex query for trending - could involve recent likes/views
        orderBy = [{ likes: { _count: 'desc' } }, { createdAt: 'desc' }];
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    // Execute query
    const [tactics, total] = await Promise.all([
      prisma.tactic.findMany({
        where,
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
          ...(userId && {
            likes: {
              where: { userId },
              select: { userId: true },
            },
            saves: {
              where: { userId },
              select: { userId: true },
            },
          }),
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.tactic.count({ where }),
    ]);

    // Transform to TacticResponse objects
    const tacticResponses = tactics.map(tactic => this.mapToTacticResponse(tactic, userId));

    return {
      tactics: tacticResponses,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: tactics.length,
        totalItems: total,
        hasNext: skip + tactics.length < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get a single tactic by ID
   */
  async getTacticById(id: string, userId?: string) {
    const tactic = await prisma.tactic.findUnique({
      where: { id },
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
        ...(userId && {
          likes: {
            where: { userId },
            select: { userId: true },
          },
          saves: {
            where: { userId },
            select: { userId: true },
          },
        }),
      },
    });

    if (!tactic) {
      throw createError('Tactic not found', 404);
    }

    return this.mapToTacticResponse(tactic, userId);
  }

  /**
   * Create a new tactic
   */
  async createTactic(data: TacticFormData, userId: string) {
    if (!data.players || data.players.length !== 11) {
      throw createError('Exactly 11 players are required', 400);
    }

    // Validate formation format
    if (!/^\d+-\d+(-\d+)*$/.test(data.formation)) {
      throw createError('Invalid formation format', 400);
    }

    // Limit tags to 5
    const tags = data.tags.slice(0, 5);

    const tactic = await prisma.tactic.create({
      data: {
        title: data.title,
        formation: data.formation,
        tags,
        description: data.description,
        players: JSON.stringify(data.players),
        author: {
          connect: { id: userId },
        },
      },
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
      },
    });

    return this.mapToTacticResponse(tactic, userId);
  }

  /**
   * Update an existing tactic
   */
  async updateTactic(id: string, data: Partial<TacticFormData>, userId: string) {
    // Check if tactic exists and user is the owner
    const existingTactic = await prisma.tactic.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!existingTactic) {
      throw createError('Tactic not found', 404);
    }

    if (existingTactic.authorId !== userId) {
      throw createError('You can only update your own tactics', 403);
    }

    // Build update data
    const updateData: any = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;

    // Validate players if provided
    if (data.players !== undefined) {
      if (data.players.length !== 11) {
        throw createError('Exactly 11 players are required', 400);
      }
      updateData.players = data.players;
    }

    // Validate formation if provided
    if (data.formation !== undefined) {
      if (!/^\d+-\d+(-\d+)*$/.test(data.formation)) {
        throw createError('Invalid formation format', 400);
      }
      updateData.formation = data.formation;
    }

    // Limit tags to 5 if provided
    if (data.tags !== undefined) {
      updateData.tags = data.tags.slice(0, 5);
    }

    const updatedTactic = await prisma.tactic.update({
      where: { id },
      data: updateData,
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
        saves: {
          where: { userId },
          select: { userId: true },
        },
      },
    });

    return this.mapToTacticResponse(updatedTactic, userId);
  }

  /**
   * Delete a tactic
   */
  async deleteTactic(id: string, userId: string) {
    // Check if tactic exists and user is the owner
    const existingTactic = await prisma.tactic.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!existingTactic) {
      throw createError('Tactic not found', 404);
    }

    if (existingTactic.authorId !== userId) {
      throw createError('You can only delete your own tactics', 403);
    }

    await prisma.tactic.delete({
      where: { id },
    });

    return { success: true };
  }

  /**
   * Toggle like on a tactic
   */
  async toggleLike(tacticId: string, userId: string) {
    // Check if tactic exists
    const tactic = await prisma.tactic.findUnique({
      where: { id: tacticId },
      select: { id: true },
    });

    if (!tactic) {
      throw createError('Tactic not found', 404);
    }

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_tacticId: {
          userId,
          tacticId,
        },
      },
    });

    // Toggle like
    if (existingLike) {
      // Unlike
      await prisma.like.delete({
        where: {
          userId_tacticId: {
            userId,
            tacticId,
          },
        },
      });
      return { isLiked: false };
    } else {
      // Like
      await prisma.like.create({
        data: {
          user: {
            connect: { id: userId },
          },
          tactic: {
            connect: { id: tacticId },
          },
        },
      });
      return { isLiked: true };
    }
  }

  /**
   * Toggle save on a tactic
   */
  async toggleSave(tacticId: string, userId: string) {
    // Check if tactic exists
    const tactic = await prisma.tactic.findUnique({
      where: { id: tacticId },
      select: { id: true },
    });

    if (!tactic) {
      throw createError('Tactic not found', 404);
    }

    // Check if already saved
    const existingSave = await prisma.save.findUnique({
      where: {
        userId_tacticId: {
          userId,
          tacticId,
        },
      },
    });

    // Toggle save
    if (existingSave) {
      // Remove from saved
      await prisma.save.delete({
        where: {
          userId_tacticId: {
            userId,
            tacticId,
          },
        },
      });
      return { isSaved: false };
    } else {
      // Save
      await prisma.save.create({
        data: {
          user: {
            connect: { id: userId },
          },
          tactic: {
            connect: { id: tacticId },
          },
          savedAt: new Date(),
        },
      });
      return { isSaved: true };
    }
  }

  /**
   * Get trending tactics
   */
  async getTrendingTactics(userId?: string) {
    // Get recent tactics with most likes in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const tactics = await prisma.tactic.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
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
        ...(userId && {
          likes: {
            where: { userId },
            select: { userId: true },
          },
          saves: {
            where: { userId },
            select: { userId: true },
          },
        }),
      },
      orderBy: [{ likes: { _count: 'desc' } }, { comments: { _count: 'desc' } }],
      take: 10,
    });

    return tactics.map(tactic => this.mapToTacticResponse(tactic, userId));
  }

  /**
   * Duplicate a tactic
   */
  async duplicateTactic(tacticId: string, userId: string) {
    // Find original tactic
    const originalTactic = await prisma.tactic.findUnique({
      where: { id: tacticId },
      select: {
        title: true,
        formation: true,
        tags: true,
        description: true,
        players: true,
      },
    });

    if (!originalTactic) {
      throw createError('Tactic not found', 404);
    }

    // Create new tactic as a copy
    const newTactic = await prisma.tactic.create({
      data: {
        title: `Copy of ${originalTactic.title}`,
        formation: originalTactic.formation,
        tags: originalTactic.tags,
        description: originalTactic.description,
        players: originalTactic.players!,
        author: {
          connect: { id: userId },
        },
      },
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
      },
    });

    return this.mapToTacticResponse(newTactic, userId);
  }

  /**
   * Get popular formations
   */
  async getFormations() {
    const formationsData = await prisma.tactic.groupBy({
      by: ['formation'],
      _count: {
        formation: true,
      },
      orderBy: {
        _count: {
          formation: 'desc',
        },
      },
      take: 10,
    });

    return formationsData.map((item: any) => ({
      formation: item.formation,
      count: item._count.formation,
    }));
  }

  /**
   * Get popular tags
   */
  async getPopularTags() {
    // This requires raw SQL or aggregation in application code
    // since Prisma doesn't support aggregating array fields directly
    const tactics = await prisma.tactic.findMany({
      select: {
        tags: true,
      },
    });

    // Count tag occurrences
    const tagCounts: Record<string, number> = {};
    tactics.forEach(tactic => {
      tactic.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    // Convert to array and sort
    const tagArray = Object.entries(tagCounts).map(([tag, count]) => ({
      tag,
      count,
    }));

    return tagArray.sort((a, b) => b.count - a.count).slice(0, 20);
  }

  /**
   * Record a view on a tactic
   */
  async recordView(tacticId: string) {
    // For simplicity, we'll increment a views field directly
    // In a production app, you'd want to track unique views

    // Check if tactic exists
    const tactic = await prisma.tactic.findUnique({
      where: { id: tacticId },
      select: { id: true },
    });

    if (!tactic) {
      throw createError('Tactic not found', 404);
    }

    // TODO: Implement view tracking table in database
    // For now, we'll just return success
    return { success: true };
  }

  /**
   * Helper method to map Prisma tactic to TacticResponse
   */
  private mapToTacticResponse(tactic: any, userId?: string): TacticResponse {
    return {
      id: tactic.id,
      title: tactic.title,
      formation: tactic.formation,
      tags: tactic.tags,
      description: tactic.description,
      players: tactic.players as Player[],
      author: {
        id: tactic.author.id,
        username: tactic.author.username,
        avatar: tactic.author.avatar,
      },
      createdAt: tactic.createdAt,
      updatedAt: tactic.updatedAt,
      stats: {
        likes: tactic._count.likes,
        comments: tactic._count.comments,
        saves: tactic._count.saves,
      },
      userInteraction: userId
        ? {
            isLiked: tactic.likes?.length > 0,
            isSaved: tactic.saves?.length > 0,
            canEdit: tactic.authorId === userId,
          }
        : undefined,
    };
  }
}

export const tacticsService = new TacticsService();
