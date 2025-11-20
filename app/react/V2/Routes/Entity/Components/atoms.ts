import { atom } from 'jotai';

const searchHintsModalAtom = atom(false);

const currentPageAtom = atom<number>();

export { searchHintsModalAtom, currentPageAtom };
