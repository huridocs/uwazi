import { atom } from 'jotai';
import { ClientTranslationSchema } from 'app/istore';

const translationsAtom = atom([] as ClientTranslationSchema[]);
const localeAtom = atom('');
const inlineEditAtom = atom({ inlineEdit: false, context: '', translationKey: '' });

export { translationsAtom, inlineEditAtom, localeAtom };
