import { atom } from 'recoil';

const translationsAtom = atom({
  key: 'translations',
  default: { locale: '' },
});

export { translationsAtom };
