import { checkContrast, mixHex } from '#shared/utils/contrast.js';

const CHROME_OVERRIDE_VAR_KEYS = [
  '--color-theme-chrome-app-bar',
  '--color-theme-chrome-app-bar-fg',
  '--color-theme-chrome-app-bar-fg-hover',
  '--color-theme-chrome-app-bar-hover',
  '--color-theme-chrome-app-bar-active',
  '--color-theme-chrome-app-bar-separator',
  '--color-theme-chrome-settings-rail-bg',
  '--color-theme-chrome-settings-nav-item-active-bg',
] as const;

const HEADER_CHROME_VAR_KEYS = [
  '--color-theme-chrome-app-bar',
  '--color-theme-chrome-app-bar-fg',
  '--color-theme-chrome-app-bar-fg-hover',
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
  '--color-theme-chrome-app-bar-fg-hover': 'Header link text on hover and when current',
  '--color-theme-chrome-app-bar-hover': 'Resting fill of language, library and settings',
  '--color-theme-chrome-app-bar-active': 'Current link and header button hover',
  '--color-theme-chrome-app-bar-separator': 'Line under the header',
  '--color-theme-chrome-settings-rail-bg': 'Settings sidebar',
  '--color-theme-chrome-settings-nav-item-active-bg': 'Active settings navigation item',
};
const CHROME_VAR_LABELS: Record<ChromeOverrideVarKey, string> = {
  '--color-theme-chrome-app-bar': 'Header bar background',
  '--color-theme-chrome-app-bar-fg': 'Header bar text',
  '--color-theme-chrome-app-bar-fg-hover': 'Header bar hover text',
  '--color-theme-chrome-app-bar-hover': 'Header bar hover background',
  '--color-theme-chrome-app-bar-active': 'Header bar active background',
  '--color-theme-chrome-app-bar-separator': 'Header bar divider',
  '--color-theme-chrome-settings-rail-bg': 'Settings sidebar background',
  '--color-theme-chrome-settings-nav-item-active-bg': 'Settings navigation active background',
};

const HEADER_HOVER_TOWARD_BLACK = (0x24 - 0x1a) / 0x24;
const HEADER_ACTIVE_TOWARD_WHITE = (0x33 - 0x24) / (0xff - 0x24);
const HEADER_SECONDARY_TOWARD_BAR = (0x33 - 0x1a) / (0xff - 0x1a);
const DESIGN_DARK_INK = '#F5F0E8';
const DESIGN_DARK_SECONDARY = '#D4CDB8';
const DESIGN_LIGHT_INK = '#1A1A1A';
const DESIGN_LIGHT_SECONDARY = '#333333';

const headerHoverFill = (bar: string) => mixHex(bar, '#000000', HEADER_HOVER_TOWARD_BLACK);

const headerActiveFill = (bar: string) => mixHex(bar, '#FFFFFF', HEADER_ACTIVE_TOWARD_WHITE);

const passesOn = (grounds: string[], ink: string) =>
  grounds.every(background => checkContrast(background, ink).passesAA);

const headerInk = (grounds: string[]) => {
  const preferred = [DESIGN_DARK_INK, '#1A1A1A', '#FFFFFF'];
  const passing = preferred.find(ink => passesOn(grounds, ink));
  if (passing) return passing;
  const worst = (ink: string) =>
    Math.min(...grounds.map(background => checkContrast(background, ink).ratio));
  return preferred.reduce((best, ink) => (worst(ink) > worst(best) ? ink : best));
};

const sameHex = (left: string, right: string) => left.toUpperCase() === right.toUpperCase();

const readableFill = (fill: string, fg: string) => {
  if (passesOn([fill], fg)) return fill;
  const target = sameHex(fg, DESIGN_LIGHT_INK) ? '#FFFFFF' : '#000000';
  for (let step = 1; step <= 20; step += 1) {
    const next = mixHex(fill, target, step / 20);
    if (passesOn([next], fg)) return next;
  }
  return target;
};

const designedSecondary = (emphasis: string) => {
  if (sameHex(emphasis, DESIGN_DARK_INK)) return DESIGN_DARK_SECONDARY;
  if (sameHex(emphasis, DESIGN_LIGHT_INK)) return DESIGN_LIGHT_SECONDARY;
  return undefined;
};

const headerRestInk = (bar: string, emphasis: string) => {
  const designed = designedSecondary(emphasis);
  if (designed && passesOn([bar], designed)) return designed;
  const stepped = mixHex(emphasis, bar, HEADER_SECONDARY_TOWARD_BAR);
  if (passesOn([bar], stepped)) return stepped;
  return emphasis;
};

const headerCompanionsFromBar = (bar: string) => {
  const hover = headerHoverFill(bar);
  const active = headerActiveFill(bar);
  const emphasis = headerInk([bar, hover, active]);
  const fg = headerRestInk(bar, emphasis);
  return {
    '--color-theme-chrome-app-bar-fg': fg,
    '--color-theme-chrome-app-bar-fg-hover': emphasis,
    '--color-theme-chrome-app-bar-hover': readableFill(hover, emphasis),
    '--color-theme-chrome-app-bar-active': readableFill(active, emphasis),
    '--color-theme-chrome-app-bar-separator': mixHex(bar, emphasis, 0.28),
  };
};

const fillChromeImportDefaults = (
  partial: Partial<Record<ChromeOverrideVarKey, string>>
): Partial<Record<ChromeOverrideVarKey, string>> => {
  const bar = partial['--color-theme-chrome-app-bar'];
  if (!bar) return partial;
  const derived = headerCompanionsFromBar(bar);
  const filled: Partial<Record<ChromeOverrideVarKey, string>> = { ...partial };
  HEADER_CHROME_VAR_KEYS.forEach(key => {
    if (key === '--color-theme-chrome-app-bar') return;
    filled[key] = partial[key] ?? derived[key];
  });
  return filled;
};

export {
  CHROME_OVERRIDE_VAR_KEYS,
  HEADER_CHROME_VAR_KEYS,
  SETTINGS_CHROME_VAR_KEYS,
  CHROME_VAR_LABELS,
  CHROME_VAR_HINTS,
  fillChromeImportDefaults,
  headerCompanionsFromBar,
};
export type { ChromeOverrideVarKey };
