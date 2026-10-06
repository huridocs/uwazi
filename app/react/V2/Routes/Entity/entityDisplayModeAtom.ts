import { atom } from 'jotai';

const entityDisplayModeAtom = atom<'published' | 'entity'>('published');

export { entityDisplayModeAtom };
