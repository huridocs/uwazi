/* eslint-disable max-lines */
import {
  getAccessibleForegroundOnBackground,
  mixHex,
  WCAG_AA_LARGE_UI,
} from '#shared/utils/contrast.js';
import { UWAZI_DESIGN_DARK, UWAZI_DESIGN_LIGHT } from '#V2/theme/uwaziDesignTokens.js';

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
  | '--color-theme-shadow-xl'
  | '--color-theme-card-shadow'
  | '--color-theme-card-radius';

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

// eslint-disable-next-line max-statements
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
    '--color-theme-feedback-success-fg': getAccessibleForegroundOnBackground(
      success,
      '#FFFFFF',
      WCAG_AA_LARGE_UI
    ).foreground,
    '--color-theme-feedback-danger-fg': getAccessibleForegroundOnBackground(
      accentEmphasis,
      '#FFFFFF',
      WCAG_AA_LARGE_UI
    ).foreground,
    '--color-theme-highlight-yellow': warningTint,
    '--color-theme-highlight-yellow-active': mixHex(warning, bgSurface, 0.65),
    '--color-theme-highlight-blue': mixHex(accentSupporting, bgSurface, 0.75),
    '--color-theme-shadow-sm': `0 1px 2px ${softShadow}`,
    '--color-theme-shadow-md': `0 4px 6px -1px ${mediumShadow}, 0 2px 4px -2px ${softShadow}`,
    '--color-theme-shadow-lg': `0 10px 15px -3px ${strongShadow}, 0 4px 6px -4px ${softShadow}`,
    '--color-theme-shadow-xl': `0 20px 25px -5px ${strongShadow}, 0 8px 10px -6px ${mediumShadow}`,
    '--color-theme-card-shadow': `0 1px 3px ${mediumShadow}, 0 1px 2px ${softShadow}`,
    '--color-theme-card-radius': UWAZI_DESIGN_LIGHT.radiusMd,
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
  '--color-theme-bg-warm': UWAZI_DESIGN_LIGHT.bgWarm,
  '--color-theme-border-soft': UWAZI_DESIGN_LIGHT.borderSoft,
  '--color-theme-bg-overlay': UWAZI_DESIGN_LIGHT.bgOverlay,
  '--color-theme-bg-selected': UWAZI_DESIGN_LIGHT.bgSelected,
  '--color-theme-border-primary-64': UWAZI_DESIGN_LIGHT.borderPrimary64,
  '--color-theme-border-soft-64': UWAZI_DESIGN_LIGHT.borderSoft64,
  '--color-theme-accent-supporting-tint': UWAZI_DESIGN_LIGHT.accentSupportingTint,
  '--color-theme-accent-emphasis-tint': UWAZI_DESIGN_LIGHT.accentEmphasisTint,
  '--color-theme-success-light': UWAZI_DESIGN_LIGHT.successLight,
  '--color-theme-warning-light': UWAZI_DESIGN_LIGHT.warningLight,
  '--color-theme-danger': UWAZI_DESIGN_LIGHT.danger,
  '--color-theme-danger-light': UWAZI_DESIGN_LIGHT.dangerLight,
  '--color-theme-feedback-success-fg': getAccessibleForegroundOnBackground(
    UWAZI_DESIGN_LIGHT.success,
    '#FFFFFF',
    WCAG_AA_LARGE_UI
  ).foreground,
  '--color-theme-feedback-danger-fg': getAccessibleForegroundOnBackground(
    UWAZI_DESIGN_LIGHT.danger,
    '#FFFFFF',
    WCAG_AA_LARGE_UI
  ).foreground,
  '--color-theme-highlight-yellow': UWAZI_DESIGN_LIGHT.highlightYellow,
  '--color-theme-highlight-yellow-active': UWAZI_DESIGN_LIGHT.highlightYellowActive,
  '--color-theme-highlight-blue': UWAZI_DESIGN_LIGHT.highlightBlue,
  '--color-theme-shadow-sm': UWAZI_DESIGN_LIGHT.shadowSm,
  '--color-theme-shadow-md': UWAZI_DESIGN_LIGHT.shadowMd,
  '--color-theme-shadow-lg': UWAZI_DESIGN_LIGHT.shadowLg,
  '--color-theme-shadow-xl': UWAZI_DESIGN_LIGHT.shadowXl,
  '--color-theme-card-shadow': UWAZI_DESIGN_LIGHT.cardShadow,
  '--color-theme-card-radius': UWAZI_DESIGN_LIGHT.radiusMd,
};

const DEFAULT_DARK_DERIVED: DerivedThemeVars = {
  '--color-theme-bg-warm': UWAZI_DESIGN_DARK.bgWarm,
  '--color-theme-border-soft': UWAZI_DESIGN_DARK.borderSoft,
  '--color-theme-bg-overlay': UWAZI_DESIGN_DARK.bgOverlay,
  '--color-theme-bg-selected': UWAZI_DESIGN_DARK.bgSelected,
  '--color-theme-border-primary-64': UWAZI_DESIGN_DARK.borderPrimary64,
  '--color-theme-border-soft-64': UWAZI_DESIGN_DARK.borderSoft64,
  '--color-theme-accent-supporting-tint': UWAZI_DESIGN_DARK.accentSupportingTint,
  '--color-theme-accent-emphasis-tint': UWAZI_DESIGN_DARK.accentEmphasisTint,
  '--color-theme-success-light': UWAZI_DESIGN_DARK.successLight,
  '--color-theme-warning-light': UWAZI_DESIGN_DARK.warningLight,
  '--color-theme-danger': UWAZI_DESIGN_DARK.danger,
  '--color-theme-danger-light': UWAZI_DESIGN_DARK.dangerLight,
  '--color-theme-feedback-success-fg': DEFAULT_LIGHT_DERIVED['--color-theme-feedback-success-fg'],
  '--color-theme-feedback-danger-fg': DEFAULT_LIGHT_DERIVED['--color-theme-feedback-danger-fg'],
  '--color-theme-highlight-yellow': UWAZI_DESIGN_DARK.highlightYellow,
  '--color-theme-highlight-yellow-active': UWAZI_DESIGN_DARK.highlightYellowActive,
  '--color-theme-highlight-blue': UWAZI_DESIGN_DARK.highlightBlue,
  '--color-theme-shadow-sm': UWAZI_DESIGN_DARK.shadowSm,
  '--color-theme-shadow-md': UWAZI_DESIGN_DARK.shadowMd,
  '--color-theme-shadow-lg': UWAZI_DESIGN_DARK.shadowLg,
  '--color-theme-shadow-xl': UWAZI_DESIGN_DARK.shadowXl,
  '--color-theme-card-shadow': UWAZI_DESIGN_DARK.cardShadow,
  '--color-theme-card-radius': UWAZI_DESIGN_DARK.radiusMd,
};

const DEFAULT_LIGHT_SOURCE: EditableThemeVars = {
  '--color-theme-accent-primary': UWAZI_DESIGN_LIGHT.accentPrimary,
  '--color-theme-accent-supporting': UWAZI_DESIGN_LIGHT.accentSupporting,
  '--color-theme-accent-emphasis': UWAZI_DESIGN_LIGHT.accentEmphasis,
  '--color-theme-bg-primary': UWAZI_DESIGN_LIGHT.bgPrimary,
  '--color-theme-bg-surface': UWAZI_DESIGN_LIGHT.bgSurface,
  '--color-theme-bg-muted': UWAZI_DESIGN_LIGHT.bgMuted,
  '--color-theme-success': UWAZI_DESIGN_LIGHT.success,
  '--color-theme-warning': UWAZI_DESIGN_LIGHT.warning,
  '--color-theme-text-primary': UWAZI_DESIGN_LIGHT.textPrimary,
  '--color-theme-text-secondary': UWAZI_DESIGN_LIGHT.textSecondary,
  '--color-theme-text-tertiary': UWAZI_DESIGN_LIGHT.textTertiary,
  '--color-theme-text-muted': UWAZI_DESIGN_LIGHT.textMuted,
  '--color-theme-border-primary': UWAZI_DESIGN_LIGHT.borderPrimary,
};

const DEFAULT_DARK_SOURCE: EditableThemeVars = {
  '--color-theme-accent-primary': UWAZI_DESIGN_DARK.accentPrimary,
  '--color-theme-accent-supporting': UWAZI_DESIGN_DARK.accentSupporting,
  '--color-theme-accent-emphasis': UWAZI_DESIGN_DARK.accentEmphasis,
  '--color-theme-bg-primary': UWAZI_DESIGN_DARK.bgPrimary,
  '--color-theme-bg-surface': UWAZI_DESIGN_DARK.bgSurface,
  '--color-theme-bg-muted': UWAZI_DESIGN_DARK.bgMuted,
  '--color-theme-success': UWAZI_DESIGN_DARK.success,
  '--color-theme-warning': UWAZI_DESIGN_DARK.warning,
  '--color-theme-text-primary': UWAZI_DESIGN_DARK.textPrimary,
  '--color-theme-text-secondary': UWAZI_DESIGN_DARK.textSecondary,
  '--color-theme-text-tertiary': UWAZI_DESIGN_DARK.textTertiary,
  '--color-theme-text-muted': UWAZI_DESIGN_DARK.textMuted,
  '--color-theme-border-primary': UWAZI_DESIGN_DARK.borderPrimary,
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
