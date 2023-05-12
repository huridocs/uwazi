import { atom } from 'recoil';
import { Settings } from 'shared/types/settingsType';

const settingsAtom = atom({
  key: 'settings',
  default: {} as Settings,
});

export type { Settings };
export { settingsAtom };
