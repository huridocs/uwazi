import { atom } from 'jotai';
import { ClientSettingsFilterSchema } from 'app/apiResponseTypes';

const sidepanelAtom = atom({} as ClientSettingsFilterSchema | undefined);

export { sidepanelAtom };
