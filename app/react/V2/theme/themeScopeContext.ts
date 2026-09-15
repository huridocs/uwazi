import { createContext, useContext } from 'react';
import type { ThemeMode } from '#V2/atoms/themeModeAtom.js';
import type { ResolvedThemeVars } from '#V2/theme/tokens.js';

type ThemeScope = {
  mode: ThemeMode;
  colors: ResolvedThemeVars;
};

const ThemeScopeContext = createContext<ThemeScope | null>(null);

const useThemeScope = () => useContext(ThemeScopeContext);

export { ThemeScopeContext, useThemeScope };
export type { ThemeScope };
