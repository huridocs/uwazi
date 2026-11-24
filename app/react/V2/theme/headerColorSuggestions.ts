import { checkContrast } from '#shared/utils/contrast.js';
import { colorPaletteFromHex } from './colorPaletteFromHex.js';
import {
  HEADER_CHROME_VAR_KEYS,
  headerCompanionsFromBar,
  type ChromeOverrideVarKey,
} from './themeChromeOverrides.js';
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

const contrastRatio = (swatch: string, against: string, swatchIsBackground: boolean) =>
  checkContrast(swatchIsBackground ? swatch : against, swatchIsBackground ? against : swatch).ratio;

const colorsByContrast = (colors: string[], against: string, swatchIsBackground: boolean) =>
  [...new Set(colors.filter(isValidHex))].sort(
    (left, right) =>
      contrastRatio(right, against, swatchIsBackground) -
      contrastRatio(left, against, swatchIsBackground)
  );

const suggestionPalette = (displayValue: string, colorOptions: string[], bar: string) => [
  ...Object.values(headerCompanionsFromBar(bar)),
  ...colorPaletteFromHex(displayValue),
  ...colorOptions,
  '#1A1A1A',
  '#FFFFFF',
];

const companionSuggestion = (key: ChromeOverrideVarKey, bar: string) => {
  const proposed = headerCompanionsFromBar(bar);
  if (key in proposed) return proposed[key as keyof typeof proposed];
  return undefined;
};

const pickerInk = (key: ChromeOverrideVarKey, bar: string, text: string) => {
  if (
    key === '--color-theme-chrome-app-bar-hover' ||
    key === '--color-theme-chrome-app-bar-active'
  ) {
    return headerCompanionsFromBar(bar)['--color-theme-chrome-app-bar-fg-hover'];
  }
  return text;
};

const swatchOnBar = (key: ChromeOverrideVarKey) =>
  key === '--color-theme-chrome-app-bar-fg' ||
  key === '--color-theme-chrome-app-bar-fg-hover' ||
  key === '--color-theme-chrome-app-bar-separator';

const passingSwatches = ({
  palette,
  onBar,
  bar,
  ink,
}: {
  palette: string[];
  onBar: boolean;
  bar: string;
  ink: string;
}) => {
  const ordered = colorsByContrast(palette, onBar ? bar : ink, !onBar);
  const passes = (swatch: string) =>
    checkContrast(onBar ? bar : swatch, onBar ? swatch : ink).passesAA;
  const compatible = ordered.filter(passes);
  return { passes, shown: compatible.length ? compatible : ordered.slice(0, 1) };
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
  const ink = pickerInk(key, bar, text);
  const { passes, shown } = passingSwatches({
    palette: suggestionPalette(displayValue, colorOptions, bar),
    onBar: swatchOnBar(key),
    bar,
    ink,
  });
  const proposed = companionSuggestion(key, bar);
  const suggestion = proposed && passes(proposed) ? proposed : shown[0];
  if (!suggestion) return shown;
  return [suggestion, ...shown.filter(swatch => !sameHex(swatch, suggestion))];
};

const headerColorsFromBar = (
  themeVars: Record<string, string | undefined>,
  mode: ThemeMode,
  hex: string | undefined
) => {
  const next: Record<string, string | undefined> = { ...themeVars };
  const proposed: Record<string, string | undefined> = hex ? headerCompanionsFromBar(hex) : {};
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
