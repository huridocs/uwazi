import { atom } from 'jotai';
import { ClientSettings } from '#app/apiResponseTypes.js';

const settingsAtom = atom({} as ClientSettings);

export { settingsAtom };
