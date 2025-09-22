import { atom } from 'jotai';
import { ClientUserSchema } from '../../apiResponseTypes.js';

const userAtom = atom({} as ClientUserSchema | undefined);

export { userAtom };
