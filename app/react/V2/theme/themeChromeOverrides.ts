import { getAccessibleForegroundOnBackground, mixHex } from '#shared/utils/contrast.js';

const CHROME_OVERRIDE_VAR_KEYS = [
  '--color-theme-chrome-app-bar',
  '--color-theme-chrome-app-bar-hover',
  '--color-theme-chrome-app-bar-active',
  '--color-theme-chrome-app-bar-fg',
  '--color-theme-chrome-app-bar-separator',
  '--color-theme-chrome-settings-rail-bg',
  '--color-theme-chrome-settings-nav-item-active-bg',
] as const;

type ChromeOverrideVarKey = (typeof CHROME_OVERRIDE_VAR_KEYS)[number];

const CHROME_VAR_LABELS: Record<ChromeOverrideVarKey, string> = {
  '--color-theme-chrome-app-bar': 'Header bar background',
  '--color-theme-chrome-app-bar-hover': 'Header bar hover background',
  '--color-theme-chrome-app-bar-active': 'Header bar active background',
  '--color-theme-chrome-app-bar-fg': 'Header bar text',
  '--color-theme-chrome-app-bar-separator': 'Header bar divider',
  '--color-theme-chrome-settings-rail-bg': 'Settings sidebar background',
  '--color-theme-chrome-settings-nav-item-active-bg': 'Settings navigation active background',
};

const fillChromeImportDefaults = (
  partial: Partial<Record<ChromeOverrideVarKey, string>>
): Partial<Record<ChromeOverrideVarKey, string>> => {
  const bar = partial['--color-theme-chrome-app-bar'];
  if (!bar) return partial;
  const next: Partial<Record<ChromeOverrideVarKey, string>> = { ...partial };
  if (!next['--color-theme-chrome-app-bar-fg']) {
    next['--color-theme-chrome-app-bar-fg'] = getAccessibleForegroundOnBackground(
      bar,
      '#FFFFFF'
    ).foreground;
  }
  const fg = next['--color-theme-chrome-app-bar-fg'];
  if (!fg) return next;
  if (!next['--color-theme-chrome-app-bar-hover']) {
    next['--color-theme-chrome-app-bar-hover'] = mixHex(bar, '#000000', 0.06);
  }
  if (!next['--color-theme-chrome-app-bar-active']) {
    next['--color-theme-chrome-app-bar-active'] = mixHex(bar, '#000000', 0.1);
  }
  if (!next['--color-theme-chrome-app-bar-separator']) {
    next['--color-theme-chrome-app-bar-separator'] = mixHex(bar, fg, 0.22);
  }
  return next;
};

export { CHROME_OVERRIDE_VAR_KEYS, CHROME_VAR_LABELS, fillChromeImportDefaults };
export type { ChromeOverrideVarKey };
