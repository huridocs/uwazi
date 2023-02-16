import { atom } from 'recoil';

const translationsAtom = atom({
  key: 'TranslationsAtom',
  default: [],
});

export { translationsAtom };
