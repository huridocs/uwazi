import { atom } from 'recoil';
import { ClientSettings } from 'app/apiResponseTypes';
import { store } from 'app/store';

const settingsAtom = atom({
  key: 'settings',
  default: {} as ClientSettings,
  //sync deprecated redux store
  effects: [
    ({ onSet }) => {
      onSet(newValue => {
        store?.dispatch({ type: 'settings/collection/SET', value: newValue });
      });
    },
  ],
});

export { settingsAtom };
