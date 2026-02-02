import { atom } from 'jotai';
import { Extractor } from '#V2/shared/ParagraphExtractionTypes.js';

const filterSidepanelStatusAtom = atom({} as Partial<Extractor['statusCount']>);
const filterSidepanelAtom = atom(false);

export { filterSidepanelAtom, filterSidepanelStatusAtom };
