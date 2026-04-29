import {
  ACCENT_PRIMARY_KEY,
  NAMED_THEMES,
  PRESET_DEFINITIONS,
  SEMANTIC_VAR_KEYS,
  SEMANTIC_VAR_LABELS,
  THEME_MODES,
} from './tokens.js';
import type {
  EditableThemeVars,
  ResolvedThemeVars,
  SemanticVarKey,
  ThemeMode,
  ThemePresetId,
} from './tokens.js';
import { THEME_PALETTE } from './themePaletteList.js';
import { isValidHex, normalizeHex, sortPaletteHexColors } from './themePaletteSort.js';
export { colorPaletteFromHex } from './colorPaletteFromHex.js';

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

const themeStorageKey = (mode: ThemeMode, key: string) => `${mode}:${key}`;

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

const parseThemeStorageKey = (key: string): { mode?: ThemeMode; rawKey: string } => {
  if (key.startsWith('light:')) return { mode: 'light', rawKey: key.slice('light:'.length) };
  if (key.startsWith('dark:')) return { mode: 'dark', rawKey: key.slice('dark:'.length) };
  return { rawKey: key };
};

const getEffectiveThemeVars = (
  themeVars: ThemeVarsInput,
  themeCustomizationEnabled: boolean
): ThemeVarsInput => (themeCustomizationEnabled ? themeVars : undefined);

const getEffectiveThemeAssets = (
  themeAssets: ThemeAssets | undefined,
  themeCustomizationEnabled: boolean
) => (themeCustomizationEnabled ? themeAssets : undefined);

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
) => {
  const fromEffective = getEffectiveThemeAssets(themeAssets, themeCustomizationEnabled)?.[asset]?.[
    mode
  ];
  if (fromEffective) return fromEffective;

  const preset =
    THEME_ASSET_PRESETS[getThemeAssetPresetId(themeAssets, themeVars, themeCustomizationEnabled)][
      mode
    ][asset];

  if (!themeCustomizationEnabled) {
    return (fallback?.trim() ? fallback : preset) ?? '';
  }

  return preset ?? fallback ?? '';
};

const getPresetPair = (presetId: ThemePresetId): Record<ThemeMode, EditableThemeVars> => ({
  light: Object.fromEntries(
    SEMANTIC_VAR_KEYS.map(key => [key, PRESET_DEFINITIONS[presetId].modes.light[key]])
  ) as EditableThemeVars,
  dark: Object.fromEntries(
    SEMANTIC_VAR_KEYS.map(key => [key, PRESET_DEFINITIONS[presetId].modes.dark[key]])
  ) as EditableThemeVars,
});

/**
 * Builds the resolved palette for `mode`. When `themeCustomizationEnabled` is false, stored
 * `themeVars` are ignored and `getPresetId` resolves to `legacy`; keep this flag aligned with
 * `ThemeProvider`'s `useCustomizationPipeline` (`themeCustomization && !legacyChrome`) and with
 * how `presetId` is chosen when `legacyChrome` forces legacy.
 */
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

const COMPATIBILITY_VAR_ENTRIES: Array<
  [LegacySemanticVarKey | CompatibilityVarKey, keyof ResolvedThemeVars]
> = [
  ['--accent-primary', '--color-theme-accent-primary'],
  ['--accent-supporting', '--color-theme-accent-supporting'],
  ['--accent-emphasis', '--color-theme-accent-emphasis'],
  ['--bg-primary', '--color-theme-bg-primary'],
  ['--bg-surface', '--color-theme-bg-surface'],
  ['--bg-warm', '--color-theme-bg-warm'],
  ['--bg-muted', '--color-theme-bg-muted'],
  ['--text-primary', '--color-theme-text-primary'],
  ['--text-secondary', '--color-theme-text-secondary'],
  ['--text-tertiary', '--color-theme-text-tertiary'],
  ['--text-muted', '--color-theme-text-muted'],
  ['--border-primary', '--color-theme-border-primary'],
  ['--border-soft', '--color-theme-border-soft'],
  ['--bg-overlay', '--color-theme-bg-overlay'],
  ['--bg-selected', '--color-theme-bg-selected'],
  ['--border-primary-64', '--color-theme-border-primary-64'],
  ['--border-soft-64', '--color-theme-border-soft-64'],
  ['--accent-supporting-tint', '--color-theme-accent-supporting-tint'],
  ['--accent-emphasis-tint', '--color-theme-accent-emphasis-tint'],
  ['--success', '--color-theme-success'],
  ['--success-light', '--color-theme-success-light'],
  ['--warning', '--color-theme-warning'],
  ['--warning-light', '--color-theme-warning-light'],
  ['--danger', '--color-theme-danger'],
  ['--danger-light', '--color-theme-danger-light'],
  ['--highlight-yellow', '--color-theme-highlight-yellow'],
  ['--highlight-yellow-active', '--color-theme-highlight-yellow-active'],
  ['--highlight-blue', '--color-theme-highlight-blue'],
  ['--shadow-sm', '--color-theme-shadow-sm'],
  ['--shadow-md', '--color-theme-shadow-md'],
  ['--shadow-lg', '--color-theme-shadow-lg'],
  ['--shadow-xl', '--color-theme-shadow-xl'],
  ['--color-accent-primary', '--color-theme-accent-primary'],
  ['--color-accent-supporting', '--color-theme-accent-supporting'],
  ['--color-accent-emphasis', '--color-theme-accent-emphasis'],
  ['--color-bg-primary', '--color-theme-bg-primary'],
  ['--color-bg-surface', '--color-theme-bg-surface'],
  ['--color-bg-muted', '--color-theme-bg-muted'],
  ['--color-text-primary', '--color-theme-text-primary'],
  ['--color-text-secondary', '--color-theme-text-secondary'],
  ['--color-text-muted', '--color-theme-text-muted'],
  ['--color-border-primary', '--color-theme-border-primary'],
];

const toCompatibilityVars = (resolved: ResolvedThemeVars): Record<string, string> =>
  Object.fromEntries(
    COMPATIBILITY_VAR_ENTRIES.map(([key, resolvedKey]) => [key, resolved[resolvedKey]])
  );

export {
  THEME_MODES,
  THEME_PRESET_KEY,
  SEMANTIC_VAR_KEYS,
  ACCENT_PRIMARY_KEY,
  SEMANTIC_VAR_LABELS,
  THEME_PALETTE,
  isValidHex,
  normalizeHex,
  sortPaletteHexColors,
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
