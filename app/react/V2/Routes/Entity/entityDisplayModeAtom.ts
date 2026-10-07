import { atom } from 'jotai';

type EntityDisplayMode = 'published' | 'entity';

const entityDisplayModesAtom = atom<Record<string, EntityDisplayMode>>({});

const readEntityDisplayMode = (
  modes: Record<string, EntityDisplayMode>,
  sharedId: string | undefined
): EntityDisplayMode => (sharedId && modes[sharedId]) || 'published';

const writeEntityDisplayMode = (
  modes: Record<string, EntityDisplayMode>,
  sharedId: string,
  mode: EntityDisplayMode
) => (modes[sharedId] === mode ? modes : { ...modes, [sharedId]: mode });

const clearEntityDisplayMode = (modes: Record<string, EntityDisplayMode>, sharedId: string) => {
  if (!(sharedId in modes)) return modes;
  const next = { ...modes };
  delete next[sharedId];
  return next;
};

export {
  clearEntityDisplayMode,
  entityDisplayModesAtom,
  readEntityDisplayMode,
  writeEntityDisplayMode,
};
export type { EntityDisplayMode };
