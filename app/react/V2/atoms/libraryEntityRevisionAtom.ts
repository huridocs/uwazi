import { atom } from 'jotai';
import type { EntityTranslationsDTO } from '#shared/types/entityWithTranslations.js';

type LibraryEntityRevision = {
  sharedId: string;
  translations: EntityTranslationsDTO;
};

const libraryEntityRevisionAtom = atom<LibraryEntityRevision | undefined>(undefined);

export { libraryEntityRevisionAtom };
export type { LibraryEntityRevision };
