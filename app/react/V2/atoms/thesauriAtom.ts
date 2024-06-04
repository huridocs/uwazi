import { atom } from 'jotai';
import { ClientThesaurus } from 'app/apiResponseTypes';

const thesauriAtom = atom([] as ClientThesaurus[]);

export { thesauriAtom };
