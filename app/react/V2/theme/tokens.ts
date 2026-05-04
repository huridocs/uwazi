/* eslint-disable max-lines */
import { getAccessibleForegroundOnBackground, mixHex } from '#shared/utils/contrast.js';

type ThemePresetId = 'default' | 'legacy' | 'custom';
type ThemeMode = 'light' | 'dark';

const THEME_MODES = ['light', 'dark'] as const;

const SEMANTIC_VAR_KEYS = [
  '--color-theme-accent-primary',
  '--color-theme-accent-supporting',
  '--color-theme-accent-emphasis',
  '--color-theme-bg-primary',
  '--color-theme-bg-surface',
  '--color-theme-bg-muted',
  '--color-theme-success',
  '--color-theme-warning',
  '--color-theme-text-primary',
  '--color-theme-text-secondary',
  '--color-theme-text-tertiary',
  '--color-theme-text-muted',
  '--color-theme-border-primary',
] as const;

type SemanticVarKey = (typeof SEMANTIC_VAR_KEYS)[number];

const ACCENT_PRIMARY_KEY = '--color-theme-accent-primary' as const;

const SEMANTIC_VAR_LABELS: Record<SemanticVarKey, string> = {
  '--color-theme-accent-primary': 'Primary action',
  '--color-theme-accent-supporting': 'Supporting accent',
  '--color-theme-accent-emphasis': 'Emphasis / danger background',
  '--color-theme-bg-primary': 'Page background',
  '--color-theme-bg-surface': 'Surface background',
  '--color-theme-bg-muted': 'Muted background',
  '--color-theme-success': 'Success background',
  '--color-theme-warning': 'Warning background',
  '--color-theme-text-primary': 'Text primary',
  '--color-theme-text-secondary': 'Text secondary',
  '--color-theme-text-tertiary': 'Text tertiary',
  '--color-theme-text-muted': 'Text muted',
  '--color-theme-border-primary': 'Border primary',
};

type ThemePaletteId =
  | 'accent-primary'
  | 'accent-supporting'
  | 'accent-emphasis'
  | 'bg-primary'
  | 'bg-surface'
  | 'bg-muted'
  | 'success'
  | 'warning';

interface ThemePaletteEntry {
  id: ThemePaletteId;
  semanticKey: SemanticVarKey;
  hex: string;
}

type EditableThemeVars = Record<SemanticVarKey, string>;

type ResolvedThemeKey =
  | SemanticVarKey
  | '--color-theme-bg-warm'
  | '--color-theme-border-soft'
  | '--color-theme-bg-overlay'
  | '--color-theme-bg-selected'
  | '--color-theme-border-primary-64'
  | '--color-theme-border-soft-64'
  | '--color-theme-accent-supporting-tint'
  | '--color-theme-accent-emphasis-tint'
  | '--color-theme-success-light'
  | '--color-theme-warning-light'
  | '--color-theme-danger'
  | '--color-theme-danger-light'
  | '--color-theme-feedback-success-fg'
  | '--color-theme-feedback-danger-fg'
  | '--color-theme-highlight-yellow'
  | '--color-theme-highlight-yellow-active'
  | '--color-theme-highlight-blue'
  | '--color-theme-shadow-sm'
  | '--color-theme-shadow-md'
  | '--color-theme-shadow-lg'
  | '--color-theme-shadow-xl';

type ResolvedThemeVars = Record<ResolvedThemeKey, string>;
type DerivedThemeKey = Exclude<ResolvedThemeKey, SemanticVarKey>;
type DerivedThemeVars = Record<DerivedThemeKey, string>;

interface ThemePresetDefinition {
  id: ThemePresetId;
  label: string;
  description: string;
  sourceModes: Record<ThemeMode, EditableThemeVars>;
  modes: Record<ThemeMode, ResolvedThemeVars>;
}

const expandHex = (hex: string) =>
  hex.length === 4
    ? `#${hex
        .slice(1)
        .split('')
        .map(value => `${value}${value}`)
        .join('')}`
    : hex;

const addAlpha = (hex: string, alpha: string) => `${expandHex(hex)}${alpha}`;

const resolveThemeVars = (source: EditableThemeVars): ResolvedThemeVars => {
  const bgPrimary = source['--color-theme-bg-primary'];
  const bgSurface = source['--color-theme-bg-surface'];
  const bgMuted = source['--color-theme-bg-muted'];
  const borderPrimary = source['--color-theme-border-primary'];
  const accentSupporting = source['--color-theme-accent-supporting'];
  const accentEmphasis = source['--color-theme-accent-emphasis'];
  const success = source['--color-theme-success'];
  const warning = source['--color-theme-warning'];
  const textPrimary = source['--color-theme-text-primary'];
  const borderSoft = mixHex(borderPrimary, bgPrimary, 0.35);
  const emphasisTint = mixHex(accentEmphasis, bgSurface, 0.88);
  const warningTint = mixHex(warning, bgSurface, 0.82);
  const softShadow = `color-mix(in srgb, ${textPrimary} 5%, transparent)`;
  const mediumShadow = `color-mix(in srgb, ${textPrimary} 7%, transparent)`;
  const strongShadow = `color-mix(in srgb, ${textPrimary} 10%, transparent)`;

  return {
    ...source,
    '--color-theme-bg-warm': mixHex(bgPrimary, bgSurface, 0.72),
    '--color-theme-border-soft': borderSoft,
    '--color-theme-bg-overlay': `color-mix(in srgb, ${textPrimary} 45%, transparent)`,
    '--color-theme-bg-selected': mixHex(bgMuted, bgSurface, 0.35),
    '--color-theme-border-primary-64': addAlpha(borderPrimary, 'A3'),
    '--color-theme-border-soft-64': addAlpha(borderSoft, 'A3'),
    '--color-theme-accent-supporting-tint': mixHex(accentSupporting, bgSurface, 0.86),
    '--color-theme-accent-emphasis-tint': emphasisTint,
    '--color-theme-success-light': mixHex(success, bgSurface, 0.86),
    '--color-theme-warning-light': warningTint,
    '--color-theme-danger': accentEmphasis,
    '--color-theme-danger-light': emphasisTint,
    '--color-theme-feedback-success-fg': getAccessibleForegroundOnBackground(success, '#FFFFFF')
      .foreground,
    '--color-theme-feedback-danger-fg': getAccessibleForegroundOnBackground(
      accentEmphasis,
      '#FFFFFF'
    ).foreground,
    '--color-theme-highlight-yellow': warningTint,
    '--color-theme-highlight-yellow-active': mixHex(warning, bgSurface, 0.65),
    '--color-theme-highlight-blue': mixHex(accentSupporting, bgSurface, 0.75),
    '--color-theme-shadow-sm': `0 1px 2px ${softShadow}`,
    '--color-theme-shadow-md': `0 4px 6px -1px ${mediumShadow}, 0 2px 4px -2px ${softShadow}`,
    '--color-theme-shadow-lg': `0 10px 15px -3px ${strongShadow}, 0 4px 6px -4px ${softShadow}`,
    '--color-theme-shadow-xl': `0 20px 25px -5px ${strongShadow}, 0 8px 10px -6px ${mediumShadow}`,
  };
};

const withPresetDerivedVars = (
  source: EditableThemeVars,
  derived: DerivedThemeVars
): ResolvedThemeVars => ({
  ...resolveThemeVars(source),
  ...derived,
});

const DEFAULT_LIGHT_DERIVED: DerivedThemeVars = {
  '--color-theme-bg-warm': '#FCFAF8',
  '--color-theme-border-soft': '#D4CDB8',
  '--color-theme-bg-overlay': '#00000066',
  '--color-theme-bg-selected': '#F0EDED',
  '--color-theme-border-primary-64': '#E0D9C8A3',
  '--color-theme-border-soft-64': '#D4CDB8A3',
  '--color-theme-accent-supporting-tint': '#DDF3FD',
  '--color-theme-accent-emphasis-tint': '#FEE2E2',
  '--color-theme-success-light': '#D1FAE5',
  '--color-theme-warning-light': '#FEF3C7',
  '--color-theme-danger': '#E8432A',
  '--color-theme-danger-light': '#FEE2E2',
  '--color-theme-feedback-success-fg': getAccessibleForegroundOnBackground('#059669', '#FFFFFF')
    .foreground,
  '--color-theme-feedback-danger-fg': getAccessibleForegroundOnBackground('#E8432A', '#FFFFFF')
    .foreground,
  '--color-theme-highlight-yellow': '#FDE68A',
  '--color-theme-highlight-yellow-active': '#FCD34D',
  '--color-theme-highlight-blue': '#BFDBFE',
  '--color-theme-shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
  '--color-theme-shadow-md':
    '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
  '--color-theme-shadow-lg':
    '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.05)',
  '--color-theme-shadow-xl':
    '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
};

const DEFAULT_DARK_DERIVED: DerivedThemeVars = {
  '--color-theme-bg-warm': '#2A2A2A',
  '--color-theme-border-soft': '#4A4A4A',
  '--color-theme-bg-overlay': '#000000AA',
  '--color-theme-bg-selected': '#333333',
  '--color-theme-border-primary-64': '#3D3D3DA3',
  '--color-theme-border-soft-64': '#4A4A4AA3',
  '--color-theme-accent-supporting-tint': '#0C3A4D',
  '--color-theme-accent-emphasis-tint': '#4A1A1A',
  '--color-theme-success-light': '#064E3B',
  '--color-theme-warning-light': '#78350F',
  '--color-theme-danger': '#E8432A',
  '--color-theme-danger-light': '#4A1A1A',
  '--color-theme-feedback-success-fg': DEFAULT_LIGHT_DERIVED['--color-theme-feedback-success-fg'],
  '--color-theme-feedback-danger-fg': DEFAULT_LIGHT_DERIVED['--color-theme-feedback-danger-fg'],
  '--color-theme-highlight-yellow': '#78350F',
  '--color-theme-highlight-yellow-active': '#92400E',
  '--color-theme-highlight-blue': '#1E3A5F',
  '--color-theme-shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.2)',
  '--color-theme-shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2)',
  '--color-theme-shadow-lg':
    '0 10px 15px -3px rgba(0, 0, 0, 0.35), 0 4px 6px -4px rgba(0, 0, 0, 0.2)',
  '--color-theme-shadow-xl':
    '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.25)',
};

const DEFAULT_LIGHT_SOURCE: EditableThemeVars = {
  '--color-theme-accent-primary': '#1A1A1A',
  '--color-theme-accent-supporting': '#00B4F0',
  '--color-theme-accent-emphasis': '#E8432A',
  '--color-theme-bg-primary': '#F5F0E8',
  '--color-theme-bg-surface': '#FFFFFF',
  '--color-theme-bg-muted': '#F5EED7',
  '--color-theme-success': '#059669',
  '--color-theme-warning': '#F59E0B',
  '--color-theme-text-primary': '#1A1A1A',
  '--color-theme-text-secondary': '#333333',
  '--color-theme-text-tertiary': '#555555',
  '--color-theme-text-muted': '#777777',
  '--color-theme-border-primary': '#E0D9C8',
};

const DEFAULT_DARK_SOURCE: EditableThemeVars = {
  '--color-theme-accent-primary': '#F5F0E8',
  '--color-theme-accent-supporting': '#00B4F0',
  '--color-theme-accent-emphasis': '#E8432A',
  '--color-theme-bg-primary': '#1A1A1A',
  '--color-theme-bg-surface': '#242424',
  '--color-theme-bg-muted': '#333333',
  '--color-theme-success': '#059669',
  '--color-theme-warning': '#F59E0B',
  '--color-theme-text-primary': '#F5F0E8',
  '--color-theme-text-secondary': '#D4CDB8',
  '--color-theme-text-tertiary': '#9A9A9A',
  '--color-theme-text-muted': '#6B6B6B',
  '--color-theme-border-primary': '#3D3D3D',
};

const LEGACY_LIGHT_SOURCE: EditableThemeVars = {
  ...DEFAULT_LIGHT_SOURCE,
  '--color-theme-accent-primary': '#2B56C1',
  '--color-theme-accent-supporting': '#2196F3',
  '--color-theme-accent-emphasis': '#D9534F',
  '--color-theme-bg-primary': '#FFFFFF',
  '--color-theme-bg-surface': '#FFFFFF',
  '--color-theme-bg-muted': '#F3F4F6',
  '--color-theme-text-primary': '#101828',
  '--color-theme-text-secondary': '#475467',
  '--color-theme-text-tertiary': '#667085',
  '--color-theme-text-muted': '#6B7280',
  '--color-theme-border-primary': '#E5E7EB',
};

const LEGACY_DARK_SOURCE: EditableThemeVars = {
  ...DEFAULT_DARK_SOURCE,
  '--color-theme-accent-primary': '#93C5FD',
  '--color-theme-accent-supporting': '#60A5FA',
  '--color-theme-accent-emphasis': '#F87171',
  '--color-theme-bg-primary': '#111827',
  '--color-theme-bg-surface': '#1F2937',
  '--color-theme-bg-muted': '#374151',
  '--color-theme-text-primary': '#F9FAFB',
  '--color-theme-text-secondary': '#E5E7EB',
  '--color-theme-text-tertiary': '#CBD5E1',
  '--color-theme-text-muted': '#94A3B8',
  '--color-theme-border-primary': '#374151',
};

const PRESET_SOURCE_MODES: Record<ThemePresetId, Record<ThemeMode, EditableThemeVars>> = {
  default: { light: DEFAULT_LIGHT_SOURCE, dark: DEFAULT_DARK_SOURCE },
  legacy: { light: LEGACY_LIGHT_SOURCE, dark: LEGACY_DARK_SOURCE },
  custom: { light: DEFAULT_LIGHT_SOURCE, dark: DEFAULT_DARK_SOURCE },
};

const PRESET_DEFINITIONS: Record<ThemePresetId, ThemePresetDefinition> = {
  default: {
    id: 'default',
    label: 'Uwazi Design',
    description: 'Uses the uwazi-design light and dark token pair.',
    sourceModes: PRESET_SOURCE_MODES.default,
    modes: {
      light: withPresetDerivedVars(DEFAULT_LIGHT_SOURCE, DEFAULT_LIGHT_DERIVED),
      dark: withPresetDerivedVars(DEFAULT_DARK_SOURCE, DEFAULT_DARK_DERIVED),
    },
  },
  legacy: {
    id: 'legacy',
    label: 'Legacy Uwazi',
    description: 'Keeps the existing Uwazi feel with paired light and dark tokens.',
    sourceModes: PRESET_SOURCE_MODES.legacy,
    modes: {
      light: withPresetDerivedVars(LEGACY_LIGHT_SOURCE, {
        ...DEFAULT_LIGHT_DERIVED,
        '--color-theme-bg-warm': '#F9FAFB',
        '--color-theme-border-soft': '#E5E7EB',
        '--color-theme-bg-selected': '#F2F2F4',
        '--color-theme-border-primary-64': '#E5E7EBA3',
        '--color-theme-border-soft-64': '#E5E7EBA3',
        '--color-theme-accent-supporting-tint': '#DBEAFE',
      }),
      dark: withPresetDerivedVars(LEGACY_DARK_SOURCE, {
        ...DEFAULT_DARK_DERIVED,
        '--color-theme-bg-warm': '#243041',
        '--color-theme-border-soft': '#4B5563',
        '--color-theme-bg-selected': '#243041',
        '--color-theme-border-primary-64': '#374151A3',
        '--color-theme-border-soft-64': '#4B5563A3',
        '--color-theme-accent-supporting-tint': '#1E3A8A',
        '--color-theme-accent-emphasis-tint': '#7F1D1D',
      }),
    },
  },
  custom: {
    id: 'custom',
    label: 'Custom pair',
    description: 'Stores explicit light and dark values using the semantic theme token contract.',
    sourceModes: PRESET_SOURCE_MODES.custom,
    modes: {
      light: withPresetDerivedVars(DEFAULT_LIGHT_SOURCE, DEFAULT_LIGHT_DERIVED),
      dark: withPresetDerivedVars(DEFAULT_DARK_SOURCE, DEFAULT_DARK_DERIVED),
    },
  },
};

const NAMED_THEMES = Object.values(PRESET_DEFINITIONS);

export {
  THEME_MODES,
  SEMANTIC_VAR_KEYS,
  ACCENT_PRIMARY_KEY,
  SEMANTIC_VAR_LABELS,
  PRESET_DEFINITIONS,
  NAMED_THEMES,
  resolveThemeVars,
};
export type {
  ThemeMode,
  ThemePresetId,
  SemanticVarKey,
  EditableThemeVars,
  ResolvedThemeVars,
  ThemePresetDefinition,
  ThemePaletteEntry,
};
