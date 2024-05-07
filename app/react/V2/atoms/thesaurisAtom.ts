import { atom } from 'jotai';
import { ClientThesaurus } from 'app/apiResponseTypes';

const thesaurisAtom = atom([] as ClientThesaurus[]);

export { thesaurisAtom };
