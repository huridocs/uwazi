import {
  ACCENT_PRIMARY_KEY,
  NAMED_THEMES,
  PRESET_DEFINITIONS,
  SEMANTIC_VAR_KEYS,
  SEMANTIC_VAR_LABELS,
  THEME_MODES,
  THEME_PALETTE,
} from './tokens.js';
import type {
  EditableThemeVars,
  ResolvedThemeVars,
  SemanticVarKey,
  ThemeMode,
  ThemePresetId,
} from './tokens.js';

const THEME_PRESET_KEY = '__preset' as const;

type ThemeVarsInput = Record<string, string | undefined> | undefined;
type ThemeAssetId = 'siteLogo' | 'favicon';
type ThemeAssetPresetId = 'default' | 'legacy';
type ThemeAssets = {
  preset?: ThemeAssetPresetId;
  siteLogo?: Partial<Record<ThemeMode, string>>;
  favicon?: Partial<Record<ThemeMode, string>>;
};

type LegacySemanticVarKey =
  | '--accent-primary'
  | '--accent-supporting'
  | '--accent-emphasis'
  | '--bg-primary'
  | '--bg-surface'
  | '--bg-warm'
  | '--bg-muted'
  | '--text-primary'
  | '--text-secondary'
  | '--text-tertiary'
  | '--text-muted'
  | '--border-primary'
  | '--border-soft'
  | '--bg-overlay'
  | '--bg-selected'
  | '--border-primary-64'
  | '--border-soft-64'
  | '--accent-supporting-tint'
  | '--accent-emphasis-tint'
  | '--success'
  | '--success-light'
  | '--warning'
  | '--warning-light'
  | '--danger'
  | '--danger-light'
  | '--highlight-yellow'
  | '--highlight-yellow-active'
  | '--highlight-blue'
  | '--shadow-sm'
  | '--shadow-md'
  | '--shadow-lg'
  | '--shadow-xl';

type CompatibilityVarKey =
  | '--color-accent-primary'
  | '--color-accent-supporting'
  | '--color-accent-emphasis'
  | '--color-bg-primary'
  | '--color-bg-surface'
  | '--color-bg-muted'
  | '--color-text-primary'
  | '--color-text-secondary'
  | '--color-text-muted'
  | '--color-border-primary';

const isValidHex = (s: string) => /^#([0-9a-fA-F]{6})$/.test(s);
const normalizeHex = (s: string) => (s.startsWith('#') ? s : `#${s}`).slice(0, 7);

const THEME_ASSET_PRESETS: Record<
  ThemeAssetPresetId,
  Record<ThemeMode, Record<ThemeAssetId, string>>
> = {
  legacy: {
    light: {
      siteLogo: '/public/logo.svg',
      favicon: '/public/favicon.ico',
    },
    dark: {
      siteLogo: '/public/logo.svg',
      favicon: '/public/favicon.ico',
    },
  },
  default: {
    light: {
      siteLogo: '/public/uwazi-design-logo.svg',
      favicon: '/public/uwazi-design-icon-light.png',
    },
    dark: {
      siteLogo: '/public/uwazi-design-logo.svg',
      favicon: '/public/uwazi-design-icon-dark.png',
    },
  },
};

const themeStorageKey = (mode: ThemeMode, key: SemanticVarKey | CompatibilityVarKey) =>
  `${mode}:${key}`;

const LEGACY_THEME_KEY_MAP = {
  '--color-theme-accent-blue': '--color-theme-accent-supporting',
  '--color-theme-accent-seal': '--color-theme-accent-emphasis',
  '--color-theme-accent-blue-tint': '--color-theme-accent-supporting-tint',
  '--color-theme-accent-seal-tint': '--color-theme-accent-emphasis-tint',
} as const satisfies Record<string, string>;

const resolveLegacyKey = (key: string) => LEGACY_THEME_KEY_MAP[key as keyof typeof LEGACY_THEME_KEY_MAP];

const getEffectiveThemeVars = (
  themeVars: ThemeVarsInput,
  themeCustomizationEnabled: boolean
): ThemeVarsInput => (themeCustomizationEnabled ? themeVars : undefined);

const getEffectiveThemeAssets = (
  themeAssets: ThemeAssets | undefined,
  themeCustomizationEnabled: boolean
) => (themeCustomizationEnabled ? themeAssets : undefined);

const getThemeValue = (themeVars: ThemeVarsInput, mode: ThemeMode, key: SemanticVarKey) => {
  const modeValue = themeVars?.[themeStorageKey(mode, key)];
  if (modeValue) return modeValue;

  for (const [legacyKey, nextKey] of Object.entries(LEGACY_THEME_KEY_MAP)) {
    if (nextKey !== key) continue;
    const legacyModeValue = themeVars?.[themeStorageKey(mode, legacyKey as CompatibilityVarKey)];
    if (legacyModeValue) return legacyModeValue;
  }

  if (mode !== 'light') return undefined;

  const flatValue = themeVars?.[key];
  if (flatValue) return flatValue;

  for (const [legacyKey, nextKey] of Object.entries(LEGACY_THEME_KEY_MAP)) {
    if (nextKey !== key) continue;
    const legacyFlatValue = themeVars?.[legacyKey];
    if (legacyFlatValue) return legacyFlatValue;
  }

  return undefined;
};

const toCanonicalThemeVars = (themeVars: ThemeVarsInput): Record<string, string | undefined> => {
  if (!themeVars) return {};

  const next: Record<string, string | undefined> = {};

  Object.entries(themeVars).forEach(([key, value]) => {
    if (value === undefined) return;
    const [mode, rawKey] =
      key.startsWith('light:') || key.startsWith('dark:')
        ? (key.split(/:(.+)/) as [ThemeMode, string])
        : [undefined, key];
    const canonicalKey = resolveLegacyKey(rawKey) ?? rawKey;
    next[mode ? themeStorageKey(mode, canonicalKey as SemanticVarKey) : canonicalKey] = value;
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

const getThemeAssetPresetId = (
  themeAssets: ThemeAssets | undefined,
  themeVars: ThemeVarsInput,
  themeCustomizationEnabled: boolean
): ThemeAssetPresetId => {
  const effectiveThemeAssets = getEffectiveThemeAssets(themeAssets, themeCustomizationEnabled);
  const effectiveThemeVars = getEffectiveThemeVars(themeVars, themeCustomizationEnabled);

  if (effectiveThemeAssets?.preset === 'default' || effectiveThemeAssets?.preset === 'legacy') {
    return effectiveThemeAssets.preset;
  }
  const currentPreset = getPresetId(effectiveThemeVars, themeCustomizationEnabled);
  return currentPreset === 'legacy' ? 'legacy' : 'default';
};

const getThemeAsset = (
  themeAssets: ThemeAssets | undefined,
  themeVars: ThemeVarsInput,
  mode: ThemeMode,
  asset: ThemeAssetId,
  fallback?: string,
  themeCustomizationEnabled: boolean = true
) =>
  getEffectiveThemeAssets(themeAssets, themeCustomizationEnabled)?.[asset]?.[mode] ??
  THEME_ASSET_PRESETS[
    getThemeAssetPresetId(themeAssets, themeVars, themeCustomizationEnabled)
  ][mode][asset] ??
  fallback ??
  '';

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

const toCompatibilityVars = (
  resolved: ResolvedThemeVars
): Record<LegacySemanticVarKey | CompatibilityVarKey, string> =>
  ({
    '--accent-primary': resolved['--color-theme-accent-primary'],
    '--accent-supporting': resolved['--color-theme-accent-supporting'],
    '--accent-emphasis': resolved['--color-theme-accent-emphasis'],
    '--bg-primary': resolved['--color-theme-bg-primary'],
    '--bg-surface': resolved['--color-theme-bg-surface'],
    '--bg-warm': resolved['--color-theme-bg-warm'],
    '--bg-muted': resolved['--color-theme-bg-muted'],
    '--text-primary': resolved['--color-theme-text-primary'],
    '--text-secondary': resolved['--color-theme-text-secondary'],
    '--text-tertiary': resolved['--color-theme-text-tertiary'],
    '--text-muted': resolved['--color-theme-text-muted'],
    '--border-primary': resolved['--color-theme-border-primary'],
    '--border-soft': resolved['--color-theme-border-soft'],
    '--bg-overlay': resolved['--color-theme-bg-overlay'],
    '--bg-selected': resolved['--color-theme-bg-selected'],
    '--border-primary-64': resolved['--color-theme-border-primary-64'],
    '--border-soft-64': resolved['--color-theme-border-soft-64'],
    '--accent-supporting-tint': resolved['--color-theme-accent-supporting-tint'],
    '--accent-emphasis-tint': resolved['--color-theme-accent-emphasis-tint'],
    '--success': resolved['--color-theme-success'],
    '--success-light': resolved['--color-theme-success-light'],
    '--warning': resolved['--color-theme-warning'],
    '--warning-light': resolved['--color-theme-warning-light'],
    '--danger': resolved['--color-theme-danger'],
    '--danger-light': resolved['--color-theme-danger-light'],
    '--highlight-yellow': resolved['--color-theme-highlight-yellow'],
    '--highlight-yellow-active': resolved['--color-theme-highlight-yellow-active'],
    '--highlight-blue': resolved['--color-theme-highlight-blue'],
    '--shadow-sm': resolved['--color-theme-shadow-sm'],
    '--shadow-md': resolved['--color-theme-shadow-md'],
    '--shadow-lg': resolved['--color-theme-shadow-lg'],
    '--shadow-xl': resolved['--color-theme-shadow-xl'],
    '--color-accent-primary': resolved['--color-theme-accent-primary'],
    '--color-accent-supporting': resolved['--color-theme-accent-supporting'],
    '--color-accent-emphasis': resolved['--color-theme-accent-emphasis'],
    '--color-bg-primary': resolved['--color-theme-bg-primary'],
    '--color-bg-surface': resolved['--color-theme-bg-surface'],
    '--color-bg-muted': resolved['--color-theme-bg-muted'],
    '--color-text-primary': resolved['--color-theme-text-primary'],
    '--color-text-secondary': resolved['--color-theme-text-secondary'],
    '--color-text-muted': resolved['--color-theme-text-muted'],
    '--color-border-primary': resolved['--color-theme-border-primary'],
  }) satisfies Record<LegacySemanticVarKey | CompatibilityVarKey, string>;

export {
  THEME_MODES,
  THEME_PRESET_KEY,
  SEMANTIC_VAR_KEYS,
  ACCENT_PRIMARY_KEY,
  SEMANTIC_VAR_LABELS,
  THEME_PALETTE,
  isValidHex,
  normalizeHex,
  NAMED_THEMES,
  appliedTheme,
  getPresetPair,
  getPresetVars,
  getCustomThemeVars,
  getPresetId,
  getThemeAssetPresetId,
  getThemeAsset,
  themeStorageKey,
  toCanonicalThemeVars,
  toCompatibilityVars,
};
export type {
  ThemeMode,
  ThemePresetId,
  SemanticVarKey,
  ResolvedThemeVars,
  ThemeAssetId,
  ThemeAssetPresetId,
  ThemeAssets,
};
