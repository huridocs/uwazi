import { atom } from 'jotai';
import { Template } from '#app/apiResponseTypes.js';

const templatesAtom = atom([] as Template[]);

export { templatesAtom };
