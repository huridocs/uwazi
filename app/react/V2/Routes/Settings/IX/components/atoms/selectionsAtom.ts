import { atom } from 'jotai';
import { ExtractedMetadataSchema } from 'shared/types/commonTypes';

const selectionsAtom = atom<ExtractedMetadataSchema[] | undefined>([]);

export { selectionsAtom };
