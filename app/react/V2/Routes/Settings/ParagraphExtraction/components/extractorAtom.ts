import { atom } from 'jotai';
import { Extractor } from 'V2/shared/ParagraphExtractionTypes';

const extractorAtom = atom({} as Extractor);

export { extractorAtom };
