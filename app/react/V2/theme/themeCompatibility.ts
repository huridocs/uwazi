import type { ResolvedThemeVars } from './tokens.js';

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

export { toCompatibilityVars };
