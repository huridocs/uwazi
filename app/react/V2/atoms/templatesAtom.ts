import { atom } from 'jotai';
import { Template } from '../../apiResponseTypes.js';

const templatesAtom = atom([] as Template[]);

export { templatesAtom };
