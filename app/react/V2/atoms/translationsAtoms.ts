import { atom } from 'jotai';
import { ClientTranslationSchema } from 'app/istore';

const translationsAtom = atom({ translations: [] as ClientTranslationSchema[], locale: '' });

const inlineEditAtom = atom({ inlineEdit: false, context: '', translationKey: '' });

export { translationsAtom, inlineEditAtom };
