import { ClientTranslationSchema } from 'app/istore';
import { atom } from 'recoil';

const translationsAtom = atom({
  key: 'translations',
  default: { translations: [] as ClientTranslationSchema[], locale: '' },
  //sync deprecated redux store
  //   effects: [
  //     ({ onSet }) => {
  //       onSet(newValue => {
  //         store?.dispatch({ type: 'templates/SET', value: newValue });
  //       });
  //     },
  //   ],
});

const inlineEditAtom = atom({
  key: 'inlineEdit',
  default: { inlineEdit: false, context: '', translationKey: '' } as {
    inlineEdit: boolean;
    context?: string;
    translationKey?: string;
  },
});

export { translationsAtom, inlineEditAtom };
