import { atom } from 'jotai';
import { ExtractedMetadataSchema } from '#shared/types/commonTypes.js';

const selectionsAtom = atom<ExtractedMetadataSchema[] | undefined>([]);

export { selectionsAtom };
