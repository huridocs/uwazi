import { SEMANTIC_VAR_KEYS } from './tokens.js';
import type { SemanticVarKey, ThemeMode, ThemePresetId } from './tokens.js';
import { isValidHex, normalizeHex } from './themePaletteSort.js';
import { appliedTheme, THEME_PRESET_KEY } from './themes.js';
import {
  recomputeSimpleThemeVarsFromAnchors,
  THEME_EDITOR_MODE_KEY,
  THEME_SIMPLE_BASE_KEY,
} from './themeSimpleDerivation.js';
import {
  CHROME_OVERRIDE_VAR_KEYS,
  fillChromeImportDefaults,
  type ChromeOverrideVarKey,
} from './themeChromeOverrides.js';

const storageKey = (mode: ThemeMode, key: string) => `${mode}:${key}`;

type ThemeInstanceFile = {
  id?: string;
  light?: Record<string, unknown>;
  dark?: Record<string, unknown>;
  chrome?: { light?: Record<string, unknown>; dark?: Record<string, unknown> };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const semanticKey = (key: string) => SEMANTIC_VAR_KEYS.find(item => item === key);

const chromeKeyOf = (key: string) => CHROME_OVERRIDE_VAR_KEYS.find(item => item === key);

const hexEntries = (node: Record<string, unknown>) =>
  Object.entries(node).flatMap(([key, value]) => (typeof value === 'string' ? [[key, value]] : []));

const colorError = (node: Record<string, unknown>) => {
  const entries = Object.entries(node);
  if (entries.some(([, value]) => typeof value !== 'string' && !isRecord(value))) {
    return 'invalid file';
  }
  const hexes = hexEntries(node);
  if (hexes.some(([, value]) => !isValidHex(normalizeHex(value.trim()))))
    return 'invalid hex color';
  if (hexes.some(([key]) => !semanticKey(key) && !chromeKeyOf(key))) return 'unknown semantic key';
  return undefined;
};

const readColors = (
  node: unknown,
  semantic: Partial<Record<SemanticVarKey, string>>,
  chrome: Partial<Record<ChromeOverrideVarKey, string>>
): string | undefined => {
  if (!isRecord(node)) return 'invalid file';
  const error = colorError(node);
  if (error) return error;
  hexEntries(node).forEach(([key, value]) => {
    const hex = normalizeHex(value.trim());
    const semanticMatch = semanticKey(key);
    const chromeMatch = chromeKeyOf(key);
    if (semanticMatch) semantic[semanticMatch] = hex;
    if (chromeMatch) chrome[chromeMatch] = hex;
  });
  return Object.values(node).reduce<string | undefined>((nestedError, value) => {
    if (nestedError || !isRecord(value)) return nestedError;
    return readColors(value, semantic, chrome);
  }, undefined);
};

const flattenModeVars = (mode: ThemeMode, vars: Partial<Record<SemanticVarKey, string>>) => {
  const out: Record<string, string> = {};
  SEMANTIC_VAR_KEYS.forEach(key => {
    const value = vars[key];
    if (value) out[storageKey(mode, key)] = value;
  });
  return out;
};

const flattenChromeMode = (
  mode: ThemeMode,
  vars: Partial<Record<ChromeOverrideVarKey, string>>
) => {
  const filled = fillChromeImportDefaults(vars);
  const out: Record<string, string> = {};
  CHROME_OVERRIDE_VAR_KEYS.forEach(key => {
    const value = filled[key];
    if (value) out[storageKey(mode, key)] = value;
  });
  return out;
};

const absorbMode = (node: unknown, mode: ThemeMode, flat: Record<string, string>) => {
  const semantic: Partial<Record<SemanticVarKey, string>> = {};
  const chrome: Partial<Record<ChromeOverrideVarKey, string>> = {};
  const error = readColors(node, semantic, chrome);
  if (error) return error;
  Object.assign(flat, flattenModeVars(mode, semantic));
  Object.assign(flat, flattenChromeMode(mode, chrome));
  return undefined;
};

const absorbPair = (
  light: unknown,
  dark: unknown,
  flat: Record<string, string>
): string | undefined => {
  if (light !== undefined) {
    const error = absorbMode(light, 'light', flat);
    if (error) return error;
  }
  if (dark !== undefined) return absorbMode(dark, 'dark', flat);
  return undefined;
};

const editorModeOf = (value: unknown): 'simple' | 'advanced' =>
  value === 'advanced' ? 'advanced' : 'simple';

const presetIdOf = (value: unknown): ThemePresetId | undefined =>
  value === 'legacy' || value === 'default' || value === 'custom' ? value : undefined;

const parseThemeInstanceImportJson = (
  raw: unknown
):
  | { flat: Record<string, string>; editorMode: 'simple' | 'advanced'; presetId?: ThemePresetId }
  | { error: string } => {
  if (!isRecord(raw)) return { error: 'invalid file' };
  const flat: Record<string, string> = {};
  const modeError = absorbPair(raw.light, raw.dark, flat);
  if (modeError) return { error: modeError };
  const chrome = isRecord(raw.chrome) ? raw.chrome : undefined;
  const chromeError = absorbPair(chrome?.light, chrome?.dark, flat);
  if (chromeError) return { error: chromeError };
  if (Object.keys(flat).length === 0) return { error: 'empty theme' };
  return { flat, editorMode: editorModeOf(raw.editorMode), presetId: presetIdOf(raw.id) };
};

const stripHashComments = (text: string) =>
  text.replace(/("(?:\\.|[^"\\])*")|#[^\n]*/g, (match, quoted: string | undefined) => quoted ?? '');

const parseThemeInstanceImportText = (text: string) => {
  try {
    const raw: unknown = JSON.parse(stripHashComments(text));
    return parseThemeInstanceImportJson(raw);
  } catch {
    return { error: 'invalid file' };
  }
};

const themeVarsFromInstanceImport = (
  flat: Record<string, string>,
  editorMode: 'simple' | 'advanced',
  presetId?: ThemePresetId
) => {
  const basePreset = presetId === 'legacy' ? 'legacy' : 'default';
  const base: Record<string, string | undefined> = {
    [THEME_PRESET_KEY]: 'custom',
    ...flat,
    [THEME_EDITOR_MODE_KEY]: editorMode,
    [THEME_SIMPLE_BASE_KEY]: basePreset,
  };
  if (editorMode !== 'simple') return base;
  return {
    ...recomputeSimpleThemeVarsFromAnchors(base, basePreset, themeMode =>
      appliedTheme({ ...base, [THEME_PRESET_KEY]: basePreset }, themeMode, true)
    ),
    ...flat,
  };
};

export { parseThemeInstanceImportJson, parseThemeInstanceImportText, themeVarsFromInstanceImport };
export type { ThemeInstanceFile };
