export const filtrableLevels = ['read', 'write'] as const;
export type FiltrableLevel = (typeof filtrableLevels)[number];
