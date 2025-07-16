import { prisma } from './db.service';

export class CommentsService {
  async getComments(tacticId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { tacticId },
        include: { user: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.comment.count({
        where: { tacticId },
      }),
    ]);

    return {
      comments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async addComment(tacticId: string, userId: string, content: string) {
    return prisma.comment.create({
      data: {
        content,
        tacticId,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment || comment.userId !== userId) {
      throw new Error('Comment not found or unauthorized');
    }

    return prisma.comment.delete({
      where: { id: commentId },
    });
  }
}
export const commentsService = new CommentsService();
