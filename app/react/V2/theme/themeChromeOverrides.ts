import { checkContrast, mixHex } from '#shared/utils/contrast.js';

const CHROME_OVERRIDE_VAR_KEYS = [
  '--color-theme-chrome-app-bar',
  '--color-theme-chrome-app-bar-fg',
  '--color-theme-chrome-app-bar-hover',
  '--color-theme-chrome-app-bar-active',
  '--color-theme-chrome-app-bar-separator',
  '--color-theme-chrome-settings-rail-bg',
  '--color-theme-chrome-settings-nav-item-active-bg',
] as const;

const HEADER_CHROME_VAR_KEYS = [
  '--color-theme-chrome-app-bar',
  '--color-theme-chrome-app-bar-fg',
  '--color-theme-chrome-app-bar-hover',
  '--color-theme-chrome-app-bar-active',
  '--color-theme-chrome-app-bar-separator',
] as const;

const SETTINGS_CHROME_VAR_KEYS = [
  '--color-theme-chrome-settings-rail-bg',
  '--color-theme-chrome-settings-nav-item-active-bg',
] as const;

type ChromeOverrideVarKey = (typeof CHROME_OVERRIDE_VAR_KEYS)[number];

const CHROME_VAR_HINTS: Record<ChromeOverrideVarKey, string> = {
  '--color-theme-chrome-app-bar': 'Header bar',
  '--color-theme-chrome-app-bar-fg': 'Header title, language, library and settings',
  '--color-theme-chrome-app-bar-hover': 'Resting fill of language, library and settings',
  '--color-theme-chrome-app-bar-active': 'Current link and header button hover',
  '--color-theme-chrome-app-bar-separator': 'Line under the header',
  '--color-theme-chrome-settings-rail-bg': 'Settings sidebar',
  '--color-theme-chrome-settings-nav-item-active-bg': 'Active settings navigation item',
};
const CHROME_VAR_LABELS: Record<ChromeOverrideVarKey, string> = {
  '--color-theme-chrome-app-bar': 'Header bar background',
  '--color-theme-chrome-app-bar-fg': 'Header bar text',
  '--color-theme-chrome-app-bar-hover': 'Header bar hover background',
  '--color-theme-chrome-app-bar-active': 'Header bar active background',
  '--color-theme-chrome-app-bar-separator': 'Header bar divider',
  '--color-theme-chrome-settings-rail-bg': 'Settings sidebar background',
  '--color-theme-chrome-settings-nav-item-active-bg': 'Settings navigation active background',
};

const readableHeaderText = (backgrounds: string[]) => {
  const worst = (ink: string) =>
    Math.min(...backgrounds.map(background => checkContrast(background, ink).ratio));
  return worst('#1A1A1A') >= worst('#FFFFFF') ? '#1A1A1A' : '#FFFFFF';
};

const fillChromeImportDefaults = (
  partial: Partial<Record<ChromeOverrideVarKey, string>>
): Partial<Record<ChromeOverrideVarKey, string>> => {
  const bar = partial['--color-theme-chrome-app-bar'];
  if (!bar) return partial;
  const hover = partial['--color-theme-chrome-app-bar-hover'] ?? mixHex(bar, '#000000', 0.06);
  const active = partial['--color-theme-chrome-app-bar-active'] ?? mixHex(bar, '#000000', 0.1);
  const fg = partial['--color-theme-chrome-app-bar-fg'] ?? readableHeaderText([bar, hover, active]);
  return {
    ...partial,
    '--color-theme-chrome-app-bar-fg': fg,
    '--color-theme-chrome-app-bar-hover': hover,
    '--color-theme-chrome-app-bar-active': active,
    '--color-theme-chrome-app-bar-separator':
      partial['--color-theme-chrome-app-bar-separator'] ?? mixHex(bar, fg, 0.22),
  };
};

export {
  CHROME_OVERRIDE_VAR_KEYS,
  HEADER_CHROME_VAR_KEYS,
  SETTINGS_CHROME_VAR_KEYS,
  CHROME_VAR_LABELS,
  CHROME_VAR_HINTS,
  fillChromeImportDefaults,
};
export type { ChromeOverrideVarKey };
