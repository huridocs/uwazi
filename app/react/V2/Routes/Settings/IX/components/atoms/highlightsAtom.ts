import { atom } from 'jotai';
import { Highlights } from '#app/V2/Routes/Settings/IX/types';

const highlightsAtom = atom<Highlights | undefined>();

export { highlightsAtom };
