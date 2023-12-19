import { atom } from 'recoil';
import { ClientSettings } from 'app/apiResponseTypes';

const settingsAtom = atom({
  key: 'settings',
  default: {} as ClientSettings,
});

export { settingsAtom };
