export type ThemeId = 'default' | 'light' | 'dark' | 'legacy';

export const SEMANTIC_VAR_KEYS = [
  '--color-accent-primary',
  '--color-accent-secondary',
  '--color-accent-alert',
  '--color-bg-primary',
  '--color-bg-surface',
  '--color-bg-muted',
  '--color-text-primary',
  '--color-text-secondary',
  '--color-text-muted',
  '--color-border-primary',
] as const;

export type SemanticVarKey = (typeof SEMANTIC_VAR_KEYS)[number];

export const ACCENT_PRIMARY_KEY = '--color-accent-primary' as const;

export const SEMANTIC_VAR_LABELS: Record<SemanticVarKey, string> = {
  ['--color-accent-primary']: 'Accent primary',
  ['--color-accent-secondary']: 'Accent secondary',
  ['--color-accent-alert']: 'Accent alert',
  ['--color-bg-primary']: 'Background primary',
  ['--color-bg-surface']: 'Background surface',
  ['--color-bg-muted']: 'Background muted',
  ['--color-text-primary']: 'Text primary',
  ['--color-text-secondary']: 'Text secondary',
  ['--color-text-muted']: 'Text muted',
  ['--color-border-primary']: 'Border primary',
};

export interface ThemeDefinition {
  id: ThemeId;
  label: string;
  semanticVars: Record<SemanticVarKey, string>;
}

export type ThemePaletteId =
  | 'accent-primary'
  | 'accent-secondary'
  | 'accent-alert'
  | 'bg-primary'
  | 'bg-surface'
  | 'bg-muted';

export interface ThemePaletteEntry {
  id: ThemePaletteId;
  semanticKey: SemanticVarKey;
  hex: string;
}

export const THEME_PALETTE: ThemePaletteEntry[] = [
  { id: 'accent-primary', semanticKey: '--color-accent-primary', hex: '#1A1A1A' },
  { id: 'accent-secondary', semanticKey: '--color-accent-secondary', hex: '#00B4F0' },
  { id: 'accent-alert', semanticKey: '--color-accent-alert', hex: '#E8432A' },
  { id: 'bg-muted', semanticKey: '--color-bg-muted', hex: '#F5EED7' },
  { id: 'bg-primary', semanticKey: '--color-bg-primary', hex: '#F5F0E8' },
  { id: 'bg-surface', semanticKey: '--color-bg-surface', hex: '#FFFFFF' },
];

const DEFAULT_EXTRAS: Partial<Record<SemanticVarKey, string>> = {
  ['--color-text-primary']: '#1A1A1A',
  ['--color-text-secondary']: '#333333',
  ['--color-text-muted']: '#9A9A9A',
  ['--color-border-primary']: '#E0D9C8',
};

export const SEMANTIC_THEME_VARS: Record<SemanticVarKey, string> = {
  ...Object.fromEntries(THEME_PALETTE.map(p => [p.semanticKey, p.hex])),
  ...DEFAULT_EXTRAS,
} as Record<SemanticVarKey, string>;

export const isValidHex = (s: string) => /^#([0-9a-fA-F]{6})$/.test(s);
export const normalizeHex = (s: string) => (s.startsWith('#') ? s : `#${s}`).slice(0, 7);

export const getThemeColorByHex = (hex: string) =>
  THEME_PALETTE.find(p => p.hex.toLowerCase() === hex.toLowerCase()) ?? THEME_PALETTE[0];

export const getThemeColorBySemanticKey = (semanticKey: SemanticVarKey) =>
  THEME_PALETTE.find(p => p.semanticKey === semanticKey) ?? THEME_PALETTE[0];

export const getThemeColorById = (id: ThemePaletteId) =>
  THEME_PALETTE.find(p => p.id === id) ?? THEME_PALETTE[0];

const DEFAULT_THEME: Record<SemanticVarKey, string> = { ...SEMANTIC_THEME_VARS };

const LIGHT: Record<SemanticVarKey, string> = {
  ['--color-accent-primary']: '#5145CD',
  ['--color-accent-secondary']: '#1A56DB',
  ['--color-accent-alert']: '#DC2626',
  ['--color-bg-muted']: '#FAFAFA',
  ['--color-bg-primary']: '#FFFFFF',
  ['--color-bg-surface']: '#F9FAFB',
  ['--color-text-primary']: '#111928',
  ['--color-text-secondary']: '#374151',
  ['--color-text-muted']: '#9CA3AF',
  ['--color-border-primary']: '#E5E7EB',
};

const DARK: Record<SemanticVarKey, string> = {
  ['--color-accent-primary']: '#818CF8',
  ['--color-accent-secondary']: '#60A5FA',
  ['--color-accent-alert']: '#F87171',
  ['--color-bg-muted']: '#0F172A',
  ['--color-bg-primary']: '#1E293B',
  ['--color-bg-surface']: '#334155',
  ['--color-text-primary']: '#F8FAFC',
  ['--color-text-secondary']: '#CBD5E1',
  ['--color-text-muted']: '#94A3B8',
  ['--color-border-primary']: '#475569',
};

const LEGACY: Record<SemanticVarKey, string> = {
  ['--color-accent-primary']: '#2b56c1',
  ['--color-accent-secondary']: '#2196f3',
  ['--color-accent-alert']: '#d9534f',
  ['--color-bg-muted']: '#fcfcfc',
  ['--color-bg-primary']: '#ffffff',
  ['--color-bg-surface']: '#f9fafb',
  ['--color-text-primary']: '#101828',
  ['--color-text-secondary']: '#475467',
  ['--color-text-muted']: '#6b7280',
  ['--color-border-primary']: '#e5e7eb',
};

export const NAMED_THEMES: ThemeDefinition[] = [
  { id: 'default', label: 'Default', semanticVars: DEFAULT_THEME },
  { id: 'light', label: 'Light', semanticVars: LIGHT },
  { id: 'dark', label: 'Dark', semanticVars: DARK },
  { id: 'legacy', label: 'Legacy Uwazi', semanticVars: LEGACY },
];

export type ThemeSlot = { id: string; label: string; semanticKey: SemanticVarKey };

export const DEFAULT_PALETTE_SLOTS: ThemeSlot[] = THEME_PALETTE.map(p => ({
  id: p.id,
  label: SEMANTIC_VAR_LABELS[p.semanticKey],
  semanticKey: p.semanticKey,
}));

export const getSlotsForTheme = (themeId: ThemeId): ThemeSlot[] =>
  themeId === 'default'
    ? DEFAULT_PALETTE_SLOTS
    : SEMANTIC_VAR_KEYS.slice(0, 6).map(key => ({
        id: key,
        label: SEMANTIC_VAR_LABELS[key] ?? key,
        semanticKey: key,
      }));

export const getThemeById = (id: ThemeId | string): ThemeDefinition | undefined => {
  if (id === 'rebrand') return NAMED_THEMES[0];
  return NAMED_THEMES.find(t => t.id === id);
};

export const getPresetVars = (themeId: ThemeId): Record<SemanticVarKey, string> => {
  const theme = getThemeById(themeId);
  return theme ? { ...theme.semanticVars } : ({} as Record<SemanticVarKey, string>);
};

const SEMANTIC_VAR_SET = new Set<string>(SEMANTIC_VAR_KEYS);

export const appliedTheme = (
  themeVars: Record<string, string> | undefined
): Record<SemanticVarKey, string> => {
  const base = { ...SEMANTIC_THEME_VARS };
  if (themeVars && typeof themeVars === 'object') {
    for (const key of Object.keys(themeVars) as SemanticVarKey[]) {
      if (SEMANTIC_VAR_SET.has(key) && themeVars[key]) base[key] = themeVars[key];
    }
  }
  return base;
};
