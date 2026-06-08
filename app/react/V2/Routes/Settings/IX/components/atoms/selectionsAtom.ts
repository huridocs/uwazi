import { atom } from 'jotai';
import { PropertySelectionSchema } from '#shared/types/commonTypes.js';

const selectionsAtom = atom<PropertySelectionSchema[] | undefined>([]);

export { selectionsAtom };
