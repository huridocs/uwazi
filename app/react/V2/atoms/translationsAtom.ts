import { ClientTranslationSchema } from 'app/istore';
import { atom } from 'recoil';

const translationsAtom = atom({
  key: 'translations',
  default: { translations: [] as ClientTranslationSchema[], locale: '', inlineEdit: false },
  //sync deprecated redux store
  //   effects: [
  //     ({ onSet }) => {
  //       onSet(newValue => {
  //         store?.dispatch({ type: 'templates/SET', value: newValue });
  //       });
  //     },
  //   ],
});

export { translationsAtom };
