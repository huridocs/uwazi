import { atom } from 'jotai';
import { ClientSettings } from 'app/apiResponseTypes';

const settingsAtom = atom({} as ClientSettings);

export { settingsAtom };
