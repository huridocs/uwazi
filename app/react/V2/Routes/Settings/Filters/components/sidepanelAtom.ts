import { atom } from 'jotai';
import { Filter } from './helpers.js';

const sidepanelAtom = atom({} as Filter | undefined);

export { sidepanelAtom };
