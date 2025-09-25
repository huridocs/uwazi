import { atom } from 'jotai';
import { ClientUserSchema } from '#app/apiResponseTypes.js';

const userAtom = atom({} as ClientUserSchema | undefined);

export { userAtom };
