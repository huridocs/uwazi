type ThemePresetId = 'default' | 'legacy' | 'custom';
type ThemeMode = 'light' | 'dark';

const THEME_MODES = ['light', 'dark'] as const;

const SEMANTIC_VAR_KEYS = [
  '--color-theme-accent-primary',
  '--color-theme-accent-supporting',
  '--color-theme-accent-emphasis',
  '--color-theme-bg-primary',
  '--color-theme-bg-surface',
  '--color-theme-bg-warm',
  '--color-theme-bg-muted',
  '--color-theme-text-primary',
  '--color-theme-text-secondary',
  '--color-theme-text-tertiary',
  '--color-theme-text-muted',
  '--color-theme-border-primary',
  '--color-theme-border-soft',
] as const;

type SemanticVarKey = (typeof SEMANTIC_VAR_KEYS)[number];

const ACCENT_PRIMARY_KEY = '--color-theme-accent-primary' as const;

const SEMANTIC_VAR_LABELS: Record<SemanticVarKey, string> = {
  '--color-theme-accent-primary': 'Accent primary',
  '--color-theme-accent-supporting': 'Accent supporting',
  '--color-theme-accent-emphasis': 'Accent emphasis',
  '--color-theme-bg-primary': 'Background primary',
  '--color-theme-bg-surface': 'Background surface',
  '--color-theme-bg-warm': 'Background warm',
  '--color-theme-bg-muted': 'Background muted',
  '--color-theme-text-primary': 'Text primary',
  '--color-theme-text-secondary': 'Text secondary',
  '--color-theme-text-tertiary': 'Text tertiary',
  '--color-theme-text-muted': 'Text muted',
  '--color-theme-border-primary': 'Border primary',
  '--color-theme-border-soft': 'Border soft',
};

type ThemePaletteId =
  | 'accent-primary'
  | 'accent-supporting'
  | 'accent-emphasis'
  | 'bg-primary'
  | 'bg-surface'
  | 'bg-muted';

interface ThemePaletteEntry {
  id: ThemePaletteId;
  semanticKey: SemanticVarKey;
  hex: string;
}

type EditableThemeVars = Record<SemanticVarKey, string>;

type ResolvedThemeKey =
  | SemanticVarKey
  | '--color-theme-bg-overlay'
  | '--color-theme-bg-selected'
  | '--color-theme-border-primary-64'
  | '--color-theme-border-soft-64'
  | '--color-theme-accent-supporting-tint'
  | '--color-theme-accent-emphasis-tint'
  | '--color-theme-success'
  | '--color-theme-success-light'
  | '--color-theme-warning'
  | '--color-theme-warning-light'
  | '--color-theme-danger'
  | '--color-theme-danger-light'
  | '--color-theme-highlight-yellow'
  | '--color-theme-highlight-yellow-active'
  | '--color-theme-highlight-blue'
  | '--color-theme-shadow-sm'
  | '--color-theme-shadow-md'
  | '--color-theme-shadow-lg'
  | '--color-theme-shadow-xl';

type ResolvedThemeVars = Record<ResolvedThemeKey, string>;

interface ThemePresetDefinition {
  id: ThemePresetId;
  label: string;
  description: string;
  modes: Record<ThemeMode, ResolvedThemeVars>;
}

const DEFAULT_LIGHT: ResolvedThemeVars = {
  '--color-theme-accent-primary': '#1A1A1A',
  '--color-theme-accent-supporting': '#00B4F0',
  '--color-theme-accent-emphasis': '#E8432A',
  '--color-theme-bg-primary': '#F5F0E8',
  '--color-theme-bg-surface': '#FFFFFF',
  '--color-theme-bg-warm': '#FCFAF8',
  '--color-theme-bg-muted': '#F5EED7',
  '--color-theme-text-primary': '#1A1A1A',
  '--color-theme-text-secondary': '#333333',
  '--color-theme-text-tertiary': '#555555',
  '--color-theme-text-muted': '#777777',
  '--color-theme-border-primary': '#E0D9C8',
  '--color-theme-border-soft': '#D4CDB8',
  '--color-theme-bg-overlay': '#00000066',
  '--color-theme-bg-selected': '#F0EDED',
  '--color-theme-border-primary-64': '#E0D9C8A3',
  '--color-theme-border-soft-64': '#D4CDB8A3',
  '--color-theme-accent-supporting-tint': '#DDF3FD',
  '--color-theme-accent-emphasis-tint': '#FEE2E2',
  '--color-theme-success': '#059669',
  '--color-theme-success-light': '#D1FAE5',
  '--color-theme-warning': '#F59E0B',
  '--color-theme-warning-light': '#FEF3C7',
  '--color-theme-danger': '#E8432A',
  '--color-theme-danger-light': '#FEE2E2',
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

const DEFAULT_DARK: ResolvedThemeVars = {
  '--color-theme-accent-primary': '#F5F0E8',
  '--color-theme-accent-supporting': '#00B4F0',
  '--color-theme-accent-emphasis': '#E8432A',
  '--color-theme-bg-primary': '#1A1A1A',
  '--color-theme-bg-surface': '#242424',
  '--color-theme-bg-warm': '#2A2A2A',
  '--color-theme-bg-muted': '#333333',
  '--color-theme-text-primary': '#F5F0E8',
  '--color-theme-text-secondary': '#D4CDB8',
  '--color-theme-text-tertiary': '#9A9A9A',
  '--color-theme-text-muted': '#6B6B6B',
  '--color-theme-border-primary': '#3D3D3D',
  '--color-theme-border-soft': '#4A4A4A',
  '--color-theme-bg-overlay': '#000000AA',
  '--color-theme-bg-selected': '#333333',
  '--color-theme-border-primary-64': '#3D3D3DA3',
  '--color-theme-border-soft-64': '#4A4A4AA3',
  '--color-theme-accent-supporting-tint': '#0C3A4D',
  '--color-theme-accent-emphasis-tint': '#4A1A1A',
  '--color-theme-success': '#059669',
  '--color-theme-success-light': '#064E3B',
  '--color-theme-warning': '#F59E0B',
  '--color-theme-warning-light': '#78350F',
  '--color-theme-danger': '#E8432A',
  '--color-theme-danger-light': '#4A1A1A',
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

const LEGACY_LIGHT: ResolvedThemeVars = {
  ...DEFAULT_LIGHT,
  '--color-theme-accent-primary': '#2B56C1',
  '--color-theme-accent-supporting': '#2196F3',
  '--color-theme-accent-emphasis': '#D9534F',
  '--color-theme-bg-primary': '#FFFFFF',
  '--color-theme-bg-surface': '#FFFFFF',
  '--color-theme-bg-warm': '#F9FAFB',
  '--color-theme-bg-muted': '#F3F4F6',
  '--color-theme-text-primary': '#101828',
  '--color-theme-text-secondary': '#475467',
  '--color-theme-text-tertiary': '#667085',
  '--color-theme-text-muted': '#6B7280',
  '--color-theme-border-primary': '#E5E7EB',
  '--color-theme-border-soft': '#E5E7EB',
  '--color-theme-bg-selected': '#F2F2F4',
  '--color-theme-border-primary-64': '#E5E7EBA3',
  '--color-theme-border-soft-64': '#E5E7EBA3',
  '--color-theme-accent-supporting-tint': '#DBEAFE',
  '--color-theme-accent-emphasis-tint': '#FEE2E2',
};

const LEGACY_DARK: ResolvedThemeVars = {
  ...DEFAULT_DARK,
  '--color-theme-accent-primary': '#93C5FD',
  '--color-theme-accent-supporting': '#60A5FA',
  '--color-theme-accent-emphasis': '#F87171',
  '--color-theme-bg-primary': '#111827',
  '--color-theme-bg-surface': '#1F2937',
  '--color-theme-bg-warm': '#243041',
  '--color-theme-bg-muted': '#374151',
  '--color-theme-text-primary': '#F9FAFB',
  '--color-theme-text-secondary': '#E5E7EB',
  '--color-theme-text-tertiary': '#CBD5E1',
  '--color-theme-text-muted': '#94A3B8',
  '--color-theme-border-primary': '#374151',
  '--color-theme-border-soft': '#4B5563',
  '--color-theme-bg-selected': '#243041',
  '--color-theme-border-primary-64': '#374151A3',
  '--color-theme-border-soft-64': '#4B5563A3',
  '--color-theme-accent-supporting-tint': '#1E3A8A',
  '--color-theme-accent-emphasis-tint': '#7F1D1D',
};

const PRESET_DEFINITIONS: Record<ThemePresetId, ThemePresetDefinition> = {
  default: {
    id: 'default',
    label: 'Uwazi Design',
    description: 'Uses the uwazi-design light and dark token pair.',
    modes: { light: DEFAULT_LIGHT, dark: DEFAULT_DARK },
  },
  legacy: {
    id: 'legacy',
    label: 'Legacy Uwazi',
    description: 'Keeps the existing Uwazi feel with paired light and dark tokens.',
    modes: { light: LEGACY_LIGHT, dark: LEGACY_DARK },
  },
  custom: {
    id: 'custom',
    label: 'Custom pair',
    description: 'Stores explicit light and dark values using the semantic theme token contract.',
    modes: { light: DEFAULT_LIGHT, dark: DEFAULT_DARK },
  },
};

const NAMED_THEMES = Object.values(PRESET_DEFINITIONS);

const THEME_PALETTE: ThemePaletteEntry[] = [
  {
    id: 'accent-primary',
    semanticKey: '--color-theme-accent-primary',
    hex: DEFAULT_LIGHT['--color-theme-accent-primary'],
  },
  {
    id: 'accent-supporting',
    semanticKey: '--color-theme-accent-supporting',
    hex: DEFAULT_LIGHT['--color-theme-accent-supporting'],
  },
  {
    id: 'accent-emphasis',
    semanticKey: '--color-theme-accent-emphasis',
    hex: DEFAULT_LIGHT['--color-theme-accent-emphasis'],
  },
  {
    id: 'bg-muted',
    semanticKey: '--color-theme-bg-muted',
    hex: DEFAULT_LIGHT['--color-theme-bg-muted'],
  },
  {
    id: 'bg-primary',
    semanticKey: '--color-theme-bg-primary',
    hex: DEFAULT_LIGHT['--color-theme-bg-primary'],
  },
  {
    id: 'bg-surface',
    semanticKey: '--color-theme-bg-surface',
    hex: DEFAULT_LIGHT['--color-theme-bg-surface'],
  },
];

export {
  THEME_MODES,
  SEMANTIC_VAR_KEYS,
  ACCENT_PRIMARY_KEY,
  SEMANTIC_VAR_LABELS,
  PRESET_DEFINITIONS,
  NAMED_THEMES,
  THEME_PALETTE,
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
