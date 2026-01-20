import { atom } from 'jotai';
import { Filter } from '#V2/Routes/Settings/Filters/components/helpers.js';

const sidepanelAtom = atom({} as Filter | undefined);

export { sidepanelAtom };
