import { atom } from 'jotai';
import { settingsAtom } from './settingsAtom.js';
import { themeModeAtom, type ThemeMode } from './themeModeAtom.js';

const getEffectiveThemeMode = (
  customizationEnabled: boolean,
  stored: ThemeMode,
  controlled?: ThemeMode
): ThemeMode => (customizationEnabled ? (controlled ?? stored) : 'light');

const effectiveThemeModeAtom = atom(get =>
  getEffectiveThemeMode(Boolean(get(settingsAtom).themeCustomization), get(themeModeAtom))
);

export { effectiveThemeModeAtom, getEffectiveThemeMode };
