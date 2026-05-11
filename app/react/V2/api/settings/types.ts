type CollectionStats = {
  users: { total: number; admin: number; editor: number; collaborator: number };
  files: { total: number };
  entities: { total: number };
  storage: { total: number };
};

export type { CollectionStats };
