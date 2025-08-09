import { atom } from 'jotai';

const selectionErrorAtom = atom<string | undefined>('');

export { selectionErrorAtom };
