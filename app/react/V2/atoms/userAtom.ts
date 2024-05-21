import { atom } from 'jotai';
import { ClientUserSchema } from 'app/apiResponseTypes';

const userAtom = atom({} as ClientUserSchema | undefined);

export { userAtom };
