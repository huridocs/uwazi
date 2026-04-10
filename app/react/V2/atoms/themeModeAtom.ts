import { atom } from 'jotai';

type ThemeMode = 'light' | 'dark';

const themeModeAtom = atom<ThemeMode>('light');

export { themeModeAtom };
export type { ThemeMode };
