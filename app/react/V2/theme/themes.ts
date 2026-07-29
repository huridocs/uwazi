/* eslint-disable max-lines */
import {
  ACCENT_PRIMARY_KEY,
  NAMED_THEMES,
  PRESET_DEFINITIONS,
  resolveThemeVars,
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
import { getAccessibleForegroundOnBackground } from '#shared/utils/contrast.js';
import { CHROME_OVERRIDE_VAR_KEYS } from './themeChromeOverrides.js';
import { THEME_EDITOR_MODE_KEY } from './themeSimpleDerivation.js';
import { THEME_PALETTE } from './themePaletteList.js';
import { isValidHex, normalizeHex, sortPaletteHexColors } from './themePaletteSort.js';

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
  | '--accent-blue'
  | '--accent-seal'
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
  | '--accent-blue-tint'
  | '--accent-emphasis-tint'
  | '--accent-seal-tint'
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
  | '--color-border-primary'
  | '--color-border';

const THEME_ASSET_PRESETS: Record<
  ThemeAssetPresetId,
  Record<ThemeMode, Record<ThemeAssetId, string>>
> = {
  legacy: {
    light: {
      siteLogo: '/public/uwazi-theme-logo-light.svg',
      favicon: '/public/favicon.ico',
    },
    dark: {
      siteLogo: '/public/uwazi-theme-logo-dark.svg',
      favicon: '/public/favicon.ico',
    },
  },
  default: {
    light: {
      siteLogo: '/public/uwazi-design-logo.svg',
      favicon: '/public/uwazi-design-icon-light.png',
    },
    dark: {
      siteLogo: '/public/uwazi-design-logo-dark.svg',
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
  '--color-theme-bg-warm': '--color-theme-bg-muted',
  '--color-theme-border-soft': '--color-theme-border-primary',
  '--color-theme-danger': '--color-theme-accent-emphasis',
  '--success': '--color-theme-success',
  '--warning': '--color-theme-warning',
  '--danger': '--color-theme-accent-emphasis',
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

/* eslint-disable max-params -- theme asset lookup mirrors preset API surface */
const getThemeAsset = (
  themeAssets: ThemeAssets | undefined,
  themeVars: ThemeVarsInput,
  mode: ThemeMode,
  asset: ThemeAssetId,
  fallback?: string,
  themeCustomizationEnabled: boolean = true
) => {
  const presetId = getThemeAssetPresetId(themeAssets, themeVars, themeCustomizationEnabled);
  const preset = THEME_ASSET_PRESETS[presetId][mode][asset];
  const normalizeLegacyLogoAlias = (value: string | undefined) =>
    asset === 'siteLogo' && presetId === 'legacy' && value?.trim() === '/public/logo.svg'
      ? preset
      : value;
  const fromEffective = normalizeLegacyLogoAlias(
    getEffectiveThemeAssets(themeAssets, themeCustomizationEnabled)?.[asset]?.[mode]
  );
  if (fromEffective) return fromEffective;
  const normalizedFallback = normalizeLegacyLogoAlias(fallback);

  if (!themeCustomizationEnabled) {
    return (normalizedFallback?.trim() ? normalizedFallback : preset) ?? '';
  }

  return preset ?? normalizedFallback ?? '';
};
/* eslint-enable max-params */

const getPresetPair = (presetId: ThemePresetId): Record<ThemeMode, EditableThemeVars> => ({
  light: { ...PRESET_DEFINITIONS[presetId].sourceModes.light },
  dark: { ...PRESET_DEFINITIONS[presetId].sourceModes.dark },
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
  const presetSource = PRESET_DEFINITIONS[presetId].sourceModes[mode];
  const base = { ...presetSource };

  SEMANTIC_VAR_KEYS.forEach(key => {
    const value = getThemeValue(effectiveThemeVars, mode, key);
    if (value) base[key] = value;
  });

  return SEMANTIC_VAR_KEYS.some(key => base[key] !== presetSource[key])
    ? resolveThemeVars(base)
    : PRESET_DEFINITIONS[presetId].modes[mode];
};

/** Same `appliedTheme` inputs as `ThemeProvider` (third arg = `customizationOn && !legacyChrome`). */
const appliedThemeAsInProvider = (
  themeVars: ThemeVarsInput,
  mode: ThemeMode,
  opts: { customizationOn: boolean; legacyChrome?: boolean }
): ResolvedThemeVars =>
  appliedTheme(themeVars, mode, opts.customizationOn && !(opts.legacyChrome ?? false));

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
  const editorMode = themeVars?.[THEME_EDITOR_MODE_KEY];
  if (editorMode === 'simple' || editorMode === 'advanced') {
    next[THEME_EDITOR_MODE_KEY] = editorMode;
  }
  THEME_MODES.forEach(mode => {
    const resolved = appliedTheme(themeVars, mode, themeCustomizationEnabled);
    SEMANTIC_VAR_KEYS.forEach(key => {
      next[themeStorageKey(mode, key)] = resolved[key];
    });
    CHROME_OVERRIDE_VAR_KEYS.forEach(key => {
      const storage = themeStorageKey(mode, key);
      const v = themeVars?.[storage];
      if (v) next[storage] = v;
    });
  });
  return next;
};

const getChromeStyleOverrides = (
  themeVars: ThemeVarsInput,
  mode: ThemeMode
): Record<string, string> => {
  if (!themeVars) return {};
  const out: Record<string, string> = {};
  CHROME_OVERRIDE_VAR_KEYS.forEach(key => {
    const v = themeVars[themeStorageKey(mode, key)];
    if (v) out[key] = v;
  });
  return out;
};

const stripChromeStorageKeysAbsentFromImport = (
  base: Record<string, string>,
  importedFlat: Record<string, string>
): Record<string, string> => {
  const next = { ...base };
  THEME_MODES.forEach(mode => {
    CHROME_OVERRIDE_VAR_KEYS.forEach(key => {
      const sk = themeStorageKey(mode, key);
      if (!Object.prototype.hasOwnProperty.call(importedFlat, sk)) delete next[sk];
    });
  });
  return next;
};

const mergeScopedThemeAndChrome = (
  scoped: Record<string, string>,
  tenantChrome: Record<string, string>,
  resolved: ResolvedThemeVars
): Record<string, string> => {
  const merged = { ...scoped, ...tenantChrome };
  const tenantBar = tenantChrome['--color-theme-chrome-app-bar'];
  if (!tenantBar || tenantChrome['--color-theme-chrome-app-bar-fg'] !== undefined) {
    return merged;
  }
  return {
    ...merged,
    '--color-theme-chrome-app-bar-fg': getAccessibleForegroundOnBackground(
      tenantBar,
      resolved['--color-theme-text-primary']
    ).foreground,
  };
};

const COMPATIBILITY_VAR_ENTRIES: Array<
  [LegacySemanticVarKey | CompatibilityVarKey, keyof ResolvedThemeVars]
> = [
  ['--accent-primary', '--color-theme-accent-primary'],
  ['--accent-supporting', '--color-theme-accent-supporting'],
  ['--accent-blue', '--color-theme-accent-supporting'],
  ['--accent-seal', '--color-theme-accent-emphasis'],
  ['--accent-emphasis', '--color-theme-accent-emphasis'],
  ['--accent-blue-tint', '--color-theme-accent-supporting-tint'],
  ['--accent-seal-tint', '--color-theme-accent-emphasis-tint'],
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
  ['--color-border', '--color-theme-border-primary'],
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
  appliedThemeAsInProvider,
  getPresetPair,
  getPresetVars,
  getCustomThemeVars,
  getChromeStyleOverrides,
  mergeScopedThemeAndChrome,
  stripChromeStorageKeysAbsentFromImport,
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
export { CHROME_OVERRIDE_VAR_KEYS, CHROME_VAR_LABELS } from './themeChromeOverrides.js';
export type { ChromeOverrideVarKey } from './themeChromeOverrides.js';
