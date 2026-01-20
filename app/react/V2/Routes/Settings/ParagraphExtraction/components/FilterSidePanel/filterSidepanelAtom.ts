import { Extractor } from '#V2/shared//ParagraphExtractionTypes.js';
import { atom } from 'jotai';

const filterSidepanelStatusAtom = atom({} as Partial<Extractor['statusCount']>);
const filterSidepanelAtom = atom(false);

export { filterSidepanelAtom, filterSidepanelStatusAtom };
