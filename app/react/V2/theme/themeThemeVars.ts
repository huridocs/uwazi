import { PRESET_DEFINITIONS, SEMANTIC_VAR_KEYS, THEME_MODES } from './tokens.js';
import type {
  EditableThemeVars,
  ResolvedThemeVars,
  SemanticVarKey,
  ThemeMode,
  ThemePresetId,
} from './tokens.js';

const THEME_PRESET_KEY = '__preset' as const;

type ThemeVarsInput = Record<string, string | undefined> | undefined;

const LEGACY_THEME_KEY_MAP = {
  '--color-theme-accent-blue': '--color-theme-accent-supporting',
  '--color-theme-accent-seal': '--color-theme-accent-emphasis',
  '--color-theme-accent-blue-tint': '--color-theme-accent-supporting-tint',
  '--color-theme-accent-seal-tint': '--color-theme-accent-emphasis-tint',
} as const satisfies Record<string, string>;

const resolveLegacyKey = (key: string) =>
  LEGACY_THEME_KEY_MAP[key as keyof typeof LEGACY_THEME_KEY_MAP];

const getLegacyThemeKeys = (key: string) =>
  Object.entries(LEGACY_THEME_KEY_MAP).flatMap(([legacyKey, canonicalKey]) =>
    canonicalKey === key ? [legacyKey] : []
  );

const themeStorageKey = (mode: ThemeMode, key: string) => `${mode}:${key}`;

const parseThemeStorageKey = (key: string): { mode?: ThemeMode; rawKey: string } => {
  if (key.startsWith('light:')) return { mode: 'light', rawKey: key.slice('light:'.length) };
  if (key.startsWith('dark:')) return { mode: 'dark', rawKey: key.slice('dark:'.length) };
  return { rawKey: key };
};

const getEffectiveThemeVars = (
  themeVars: ThemeVarsInput,
  themeCustomizationEnabled: boolean
): ThemeVarsInput => (themeCustomizationEnabled ? themeVars : undefined);

const getThemeValue = (themeVars: ThemeVarsInput, mode: ThemeMode, key: SemanticVarKey) => {
  for (const storageKey of [key, ...getLegacyThemeKeys(key)].map(candidate =>
    themeStorageKey(mode, candidate)
  )) {
    const modeValue = themeVars?.[storageKey];
    if (modeValue) return modeValue;
  }

  if (mode !== 'light') return undefined;

  for (const storageKey of [key, ...getLegacyThemeKeys(key)]) {
    const legacyFlatValue = themeVars?.[storageKey];
    if (legacyFlatValue) return legacyFlatValue;
  }

  return undefined;
};

const toCanonicalThemeVars = (themeVars: ThemeVarsInput): Record<string, string | undefined> => {
  if (!themeVars) return {};

  const next: Record<string, string | undefined> = {};

  Object.entries(themeVars).forEach(([key, value]) => {
    if (value === undefined) return;
    const { mode, rawKey } = parseThemeStorageKey(key);
    const canonicalKey = resolveLegacyKey(rawKey) ?? rawKey;
    next[mode ? themeStorageKey(mode, canonicalKey) : canonicalKey] = value;
  });

  return next;
};

const getPresetId = (
  themeVars: ThemeVarsInput,
  themeCustomizationEnabled: boolean
): ThemePresetId => {
  if (!themeCustomizationEnabled) return 'legacy';
  const preset = themeVars?.[THEME_PRESET_KEY];
  if (preset === 'default' || preset === 'legacy' || preset === 'custom') return preset;
  return 'default';
};

const getPresetPair = (presetId: ThemePresetId): Record<ThemeMode, EditableThemeVars> => ({
  light: Object.fromEntries(
    SEMANTIC_VAR_KEYS.map(key => [key, PRESET_DEFINITIONS[presetId].modes.light[key]])
  ) as EditableThemeVars,
  dark: Object.fromEntries(
    SEMANTIC_VAR_KEYS.map(key => [key, PRESET_DEFINITIONS[presetId].modes.dark[key]])
  ) as EditableThemeVars,
});

const appliedTheme = (
  themeVars: ThemeVarsInput,
  mode: ThemeMode,
  themeCustomizationEnabled: boolean = true
): ResolvedThemeVars => {
  const effectiveThemeVars = getEffectiveThemeVars(themeVars, themeCustomizationEnabled);
  const presetId = getPresetId(effectiveThemeVars, themeCustomizationEnabled);
  const base = { ...PRESET_DEFINITIONS[presetId].modes[mode] };

  SEMANTIC_VAR_KEYS.forEach(key => {
    const value = getThemeValue(effectiveThemeVars, mode, key);
    if (value) base[key] = value;
  });

  return base;
};

const getPresetVars = (presetId: ThemePresetId): Record<string, string> => ({
  [THEME_PRESET_KEY]: presetId,
});

const getCustomThemeVars = (
  themeVars: ThemeVarsInput,
  themeCustomizationEnabled: boolean = true
): Record<string, string> => {
  const next: Record<string, string> = {
    [THEME_PRESET_KEY]: 'custom',
  };
  THEME_MODES.forEach(mode => {
    const resolved = appliedTheme(themeVars, mode, themeCustomizationEnabled);
    SEMANTIC_VAR_KEYS.forEach(key => {
      next[themeStorageKey(mode, key)] = resolved[key];
    });
  });
  return next;
};

export {
  THEME_PRESET_KEY,
  appliedTheme,
  getCustomThemeVars,
  getEffectiveThemeVars,
  getPresetId,
  getPresetPair,
  getPresetVars,
  themeStorageKey,
  toCanonicalThemeVars,
};
export type { ThemeVarsInput };
