import { atom } from 'jotai';
import { Highlights } from '#V2/Routes/Settings/IX/types.js';

const highlightsAtom = atom<Highlights | undefined>();

export { highlightsAtom };
