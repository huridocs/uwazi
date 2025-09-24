// @ts-expect-error TS(2307): Cannot find module '../../shared/V2/shared/Paragra... Remove this comment to see the full error message
import { Extractor } from 'shared/V2/shared/ParagraphExtractionTypes.js';
import { atom } from 'jotai';

const filterSidepanelStatusAtom = atom({} as Partial<Extractor['statusCount']>);
const filterSidepanelAtom = atom(false);

export { filterSidepanelAtom, filterSidepanelStatusAtom };
