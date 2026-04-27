import { atom } from 'jotai';
import { settingsAtom } from './settingsAtom.js';
import { themeModeAtom, type ThemeMode } from './themeModeAtom.js';

const getEffectiveThemeMode = (
  customizationEnabled: boolean,
  stored: ThemeMode,
  controlled?: ThemeMode
): ThemeMode => (customizationEnabled ? (controlled ?? stored) : 'light');

const themeControlledModeAtom = atom<ThemeMode | undefined>(undefined);

const effectiveThemeModeAtom = atom(get =>
  getEffectiveThemeMode(
    Boolean(get(settingsAtom).themeCustomization),
    get(themeModeAtom),
    get(themeControlledModeAtom)
  )
);

export { effectiveThemeModeAtom, getEffectiveThemeMode, themeControlledModeAtom };
