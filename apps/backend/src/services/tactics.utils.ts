// tactics.select.ts (or top of tactics.service.ts)

export const authorSelect = {
  id: true,
  username: true,
  avatar: true,
};

export const countSelect = {
  likes: true,
  comments: true,
  saves: true,
};

export const tacticSummarySelect = {
  id: true,
  title: true,
  formation: true,
  tags: true,
  createdAt: true,
  updatedAt: true,
  author: {
    select: authorSelect,
  },
  _count: {
    select: countSelect,
  },
};

export const tacticWithUserInteractionSelect = (userId: string) => ({
  ...tacticSummarySelect,
  likes: {
    where: { userId },
    select: { userId: true },
  },
  saves: {
    where: { userId },
    select: { userId: true },
  },
});
