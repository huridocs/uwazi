import { atom } from 'recoil';
import { Template } from 'app/apiResponseTypes';
import { store } from 'app/store';

const templatesAtom = atom({
  key: 'templates',
  default: [] as Template[],
  //sync deprecated redux store
  effects: [
    ({ onSet }) => {
      onSet(newValue => {
        store?.dispatch({ type: 'templates/SET', value: newValue });
      });
    },
  ],
});

export { templatesAtom };
