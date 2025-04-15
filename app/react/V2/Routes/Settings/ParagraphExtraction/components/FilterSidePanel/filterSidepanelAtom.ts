import { Extractor } from 'app/V2/shared/ParagraphExtractionTypes';
import { atom } from 'jotai';

const filterSidepanelStatusAtom = atom({} as Partial<Extractor['statusCount']>);
const filterSidepanelAtom = atom(false);

export { filterSidepanelAtom, filterSidepanelStatusAtom };
