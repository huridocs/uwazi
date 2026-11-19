import { checkContrast, mixHex } from '#shared/utils/contrast.js';
import { colorPaletteFromHex } from './colorPaletteFromHex.js';
import { HEADER_CHROME_VAR_KEYS, type ChromeOverrideVarKey } from './themeChromeOverrides.js';
import { isValidHex, normalizeHex } from './themePaletteSort.js';
import type { ThemeMode } from './tokens.js';

const storageKey = (mode: ThemeMode, key: string) => `${mode}:${key}`;

const sameHex = (left: string | undefined, right: string | undefined) =>
  left !== undefined &&
  right !== undefined &&
  normalizeHex(left).toUpperCase() === normalizeHex(right).toUpperCase();

const inkFor = (background: string) =>
  checkContrast(background, '#1A1A1A').ratio >= checkContrast(background, '#FFFFFF').ratio
    ? '#1A1A1A'
    : '#FFFFFF';

const fillForText = (bar: string, text: string, weight: number) => {
  const toward = text === '#1A1A1A' ? '#FFFFFF' : '#1A1A1A';
  const tint = mixHex(bar, toward, weight);
  return checkContrast(tint, text).passesAA ? tint : toward;
};

const companions = (bar: string, text: string) => ({
  '--color-theme-chrome-app-bar-fg': text,
  '--color-theme-chrome-app-bar-hover': fillForText(bar, text, 0.7),
  '--color-theme-chrome-app-bar-active': fillForText(bar, text, 0.85),
  '--color-theme-chrome-app-bar-separator': mixHex(bar, text, 0.28),
});

const proposalFor = (bar: string) => companions(bar, inkFor(bar));

const contrastRatio = (swatch: string, against: string, swatchIsBackground: boolean) =>
  checkContrast(swatchIsBackground ? swatch : against, swatchIsBackground ? against : swatch).ratio;

const colorsByContrast = (colors: string[], against: string, swatchIsBackground: boolean) =>
  [...new Set(colors.filter(isValidHex))].sort(
    (left, right) =>
      contrastRatio(right, against, swatchIsBackground) -
      contrastRatio(left, against, swatchIsBackground)
  );

const suggestionPalette = (displayValue: string, colorOptions: string[], bar: string) => [
  ...Object.values(proposalFor(bar)),
  ...colorPaletteFromHex(displayValue),
  ...colorOptions,
  '#1A1A1A',
  '#FFFFFF',
];

const companionSuggestion = (key: ChromeOverrideVarKey, bar: string, text: string) => {
  if (key === '--color-theme-chrome-app-bar-fg') return inkFor(bar);
  const proposed = companions(bar, text);
  if (key === '--color-theme-chrome-app-bar-hover') {
    return proposed['--color-theme-chrome-app-bar-hover'];
  }
  if (key === '--color-theme-chrome-app-bar-active') {
    return proposed['--color-theme-chrome-app-bar-active'];
  }
  if (key === '--color-theme-chrome-app-bar-separator') {
    return proposed['--color-theme-chrome-app-bar-separator'];
  }
  return undefined;
};

const headerPickerColors = ({
  key,
  displayValue,
  colorOptions,
  bar,
  text,
}: {
  key: ChromeOverrideVarKey;
  displayValue: string;
  colorOptions: string[];
  bar: string;
  text: string;
}) => {
  const palette = suggestionPalette(displayValue, colorOptions, bar);
  const textOnBar =
    key === '--color-theme-chrome-app-bar-fg' || key === '--color-theme-chrome-app-bar-separator';
  const ordered = colorsByContrast(palette, textOnBar ? bar : text, !textOnBar);
  const compatible = ordered.filter(
    swatch => checkContrast(textOnBar ? bar : swatch, textOnBar ? swatch : text).passesAA
  );
  const shown = compatible.length ? compatible : ordered.slice(0, 1);
  const proposed = companionSuggestion(key, bar, text);
  const suggestion =
    proposed && checkContrast(textOnBar ? bar : proposed, textOnBar ? proposed : text).passesAA
      ? proposed
      : shown[0];
  if (!suggestion) return shown;
  return [suggestion, ...shown.filter(swatch => !sameHex(swatch, suggestion))];
};

const headerColorsFromBar = (
  themeVars: Record<string, string | undefined>,
  mode: ThemeMode,
  hex: string | undefined
) => {
  const next: Record<string, string | undefined> = { ...themeVars };
  const proposed: Record<string, string | undefined> = hex ? proposalFor(hex) : {};
  HEADER_CHROME_VAR_KEYS.forEach(key => {
    const storedKey = storageKey(mode, key);
    if (key === '--color-theme-chrome-app-bar') {
      if (hex) next[storedKey] = hex;
      else delete next[storedKey];
      return;
    }
    const value = proposed[key];
    if (value) next[storedKey] = value;
    else delete next[storedKey];
  });
  return next;
};

export { colorsByContrast, headerColorsFromBar, headerPickerColors, inkFor };
