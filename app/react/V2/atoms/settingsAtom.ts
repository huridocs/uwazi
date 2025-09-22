import { atom } from 'jotai';
import { ClientSettings } from '../../apiResponseTypes.js';

const settingsAtom = atom({} as ClientSettings);

export { settingsAtom };
