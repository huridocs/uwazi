import { atom } from 'jotai';
import { Highlights } from '../../types';

const highlightsAtom = atom<Highlights | undefined>();

export { highlightsAtom };
