import { atom } from 'jotai';
import { ClientThesaurus } from '#app/apiResponseTypes.js';

const thesauriAtom = atom([] as ClientThesaurus[]);

export { thesauriAtom };
