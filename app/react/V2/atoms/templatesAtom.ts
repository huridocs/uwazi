import { atom } from 'jotai';
import { Template } from 'app/apiResponseTypes';

const templatesAtom = atom([] as Template[]);

export { templatesAtom };
