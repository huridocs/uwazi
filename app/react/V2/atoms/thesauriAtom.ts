import { atom } from 'jotai';
import { ClientThesaurus } from '../../apiResponseTypes.js';

const thesauriAtom = atom([] as ClientThesaurus[]);

export { thesauriAtom };
