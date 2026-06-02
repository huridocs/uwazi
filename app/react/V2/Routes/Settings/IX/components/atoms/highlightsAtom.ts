import { atom } from 'jotai';
import { Highlights } from '../../types.js';

const highlightsAtom = atom<Highlights | undefined>();

export { highlightsAtom };
