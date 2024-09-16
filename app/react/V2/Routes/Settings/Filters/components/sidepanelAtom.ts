import { atom } from 'jotai';
import { Filter } from './helpers';

const sidepanelAtom = atom({} as Filter | undefined);

export { sidepanelAtom };
