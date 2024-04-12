import { atom } from 'jotai';
import { atomEffect } from 'jotai-effect';
import { store } from 'app/store';
import { ClientSettings } from 'app/apiResponseTypes';

const settingsAtom = atom({} as ClientSettings);

//sync deprecated redux store
atomEffect(get => {
  const value = get(settingsAtom);
  store?.dispatch({ type: 'settings/collection/SET', value });
});

export { settingsAtom };
