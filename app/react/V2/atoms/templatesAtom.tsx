import { atom } from 'jotai';
import { atomEffect } from 'jotai-effect';
import { store } from 'app/store';
import { Template } from 'app/apiResponseTypes';

const templatesAtom = atom([] as Template[]);

//sync deprecated redux store
atomEffect(get => {
  const value = get(templatesAtom);
  store?.dispatch({ type: 'templates/SET', value });
});

export { templatesAtom };
