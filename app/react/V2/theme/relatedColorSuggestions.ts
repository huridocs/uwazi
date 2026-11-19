import { checkContrast, mixHex } from '#shared/utils/contrast.js';
import { colorPaletteFromHex } from './colorPaletteFromHex.js';
import { colorsByContrast, inkFor } from './headerColorSuggestions.js';
import { deriveBgMuted, deriveTextMutedStep } from './themeSimpleDerivation.js';
import { isValidHex, normalizeHex } from './themePaletteSort.js';
import type { SemanticVarKey, ThemeMode } from './tokens.js';

type ThemeVars = Record<string, string | undefined>;
type ColorContext = { page: string; surface: string; text: string };
type SemanticEdit = {
  themeVars: ThemeVars;
  mode: ThemeMode;
  hex: string;
  context: ColorContext;
};
type PickerSpec = { suggestion: string; against: string; swatchIsBackground: boolean };

const TEXT_STEP_WEIGHT: Record<string, number> = {
  '--color-theme-text-secondary': 0.22,
  '--color-theme-text-tertiary': 0.42,
  '--color-theme-text-muted': 0.62,
};

const storageKey = (mode: ThemeMode, key: string) => `${mode}:${key}`;

const sameHex = (left: string, right: string) =>
  normalizeHex(left).toUpperCase() === normalizeHex(right).toUpperCase();

const write = (themeVars: ThemeVars, mode: ThemeMode, values: Record<string, string>) => {
  const next = { ...themeVars };
  Object.entries(values).forEach(([key, value]) => {
    next[storageKey(mode, key)] = value;
  });
  return next;
};

const textSteps = (text: string, surface: string) => ({
  '--color-theme-text-secondary': deriveTextMutedStep(text, surface, 0.22),
  '--color-theme-text-tertiary': deriveTextMutedStep(text, surface, 0.42),
  '--color-theme-text-muted': deriveTextMutedStep(text, surface, 0.62),
});

const surfaceForPage = (page: string, text: string) =>
  mixHex(page, text === '#1A1A1A' ? '#FFFFFF' : '#1A1A1A', 0.14);

const readableText = (background: string, text: string) =>
  checkContrast(background, text).passesAA ? text : inkFor(background);

const pageColors = ({ themeVars, mode, hex }: SemanticEdit) => {
  const text = inkFor(hex);
  const surface = surfaceForPage(hex, text);
  return write(themeVars, mode, {
    '--color-theme-bg-primary': hex,
    '--color-theme-text-primary': text,
    '--color-theme-bg-surface': surface,
    '--color-theme-bg-muted': deriveBgMuted(surface, hex),
    '--color-theme-border-primary': mixHex(surface, text, 0.22),
    ...textSteps(text, surface),
  });
};

const surfaceColors = ({ themeVars, mode, hex, context }: SemanticEdit) => {
  const text = readableText(hex, context.text);
  return write(themeVars, mode, {
    '--color-theme-bg-surface': hex,
    '--color-theme-text-primary': text,
    '--color-theme-bg-muted': deriveBgMuted(hex, context.page),
    '--color-theme-border-primary': mixHex(hex, text, 0.22),
    ...textSteps(text, hex),
  });
};

const textColors = ({ themeVars, mode, hex, context }: SemanticEdit) =>
  write(themeVars, mode, {
    '--color-theme-text-primary': hex,
    ...textSteps(hex, context.surface),
  });

const semanticColorsFromEdit = (edit: SemanticEdit, key: SemanticVarKey) => {
  if (key === '--color-theme-bg-primary') return pageColors(edit);
  if (key === '--color-theme-bg-surface') return surfaceColors(edit);
  if (key === '--color-theme-text-primary') return textColors(edit);
  return undefined;
};

const activeFill = (rail: string, text: string) => {
  const toward = text === '#1A1A1A' ? '#FFFFFF' : '#1A1A1A';
  const tint = mixHex(rail, toward, 0.7);
  return checkContrast(tint, text).passesAA ? tint : toward;
};

const settingsColorsFromRail = (themeVars: ThemeVars, mode: ThemeMode, hex: string) =>
  write(themeVars, mode, {
    '--color-theme-chrome-settings-rail-bg': hex,
    '--color-theme-chrome-settings-nav-item-active-bg': activeFill(hex, inkFor(hex)),
  });

const passes = (swatch: string, against: string, swatchIsBackground: boolean) =>
  checkContrast(swatchIsBackground ? swatch : against, swatchIsBackground ? against : swatch)
    .passesAA;

const relatedPickerColors = ({
  suggestion,
  against,
  swatchIsBackground,
  displayValue,
  colorOptions,
}: PickerSpec & { displayValue: string; colorOptions: string[] }) => {
  const palette = [
    suggestion,
    ...colorPaletteFromHex(displayValue),
    ...colorOptions,
    '#1A1A1A',
    '#FFFFFF',
  ].filter(isValidHex);
  const ordered = colorsByContrast(palette, against, swatchIsBackground);
  const compatible = ordered.filter(swatch => passes(swatch, against, swatchIsBackground));
  const shown = compatible.length ? compatible : ordered.slice(0, 1);
  return [suggestion, ...shown.filter(swatch => !sameHex(swatch, suggestion))];
};

const textPickerSpec = (key: string, current: ColorContext): PickerSpec | undefined => {
  if (key === '--color-theme-text-primary') {
    return { suggestion: inkFor(current.page), against: current.page, swatchIsBackground: false };
  }
  const weight = TEXT_STEP_WEIGHT[key];
  if (weight === undefined) return undefined;
  return {
    suggestion: deriveTextMutedStep(current.text, current.surface, weight),
    against: current.surface,
    swatchIsBackground: false,
  };
};

const backgroundPickerSpec = (key: string, current: ColorContext): PickerSpec | undefined => {
  if (key === '--color-theme-bg-surface') {
    const text = inkFor(current.page);
    return {
      suggestion: surfaceForPage(current.page, text),
      against: text,
      swatchIsBackground: true,
    };
  }
  if (key === '--color-theme-bg-muted') {
    return {
      suggestion: deriveBgMuted(current.surface, current.page),
      against: current.text,
      swatchIsBackground: true,
    };
  }
  if (key === '--color-theme-border-primary') {
    return {
      suggestion: mixHex(current.surface, current.text, 0.22),
      against: current.surface,
      swatchIsBackground: false,
    };
  }
  return undefined;
};

const settingsPickerSpec = (key: string, rail: string): PickerSpec | undefined => {
  if (key !== '--color-theme-chrome-settings-nav-item-active-bg') return undefined;
  const text = inkFor(rail);
  return { suggestion: activeFill(rail, text), against: text, swatchIsBackground: true };
};

const relatedPickerSpec = (key: string, current: ColorContext & { rail: string }) =>
  textPickerSpec(key, current) ??
  backgroundPickerSpec(key, current) ??
  settingsPickerSpec(key, current.rail);

export { relatedPickerColors, relatedPickerSpec, semanticColorsFromEdit, settingsColorsFromRail };
