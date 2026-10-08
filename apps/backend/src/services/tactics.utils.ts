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

/**
 * The summary plus what a list card needs to draw its preview. Kept separate
 * from tacticSummarySelect so nothing else that reuses the summary starts
 * loading animations.
 */
export const tacticCardSelect = {
  ...tacticSummarySelect,
  players: true,
  fieldSettings: true,
  oppositionPlayers: true,
  oppositionFieldSettings: true,
  animation: true,
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
