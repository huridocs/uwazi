const SPACING_THEME_VARS = {
  '--spacing-theme-0-5': '2px',
  '--spacing-theme-1': '4px',
  '--spacing-theme-1-5': '6px',
  '--spacing-theme-2': '8px',
  '--spacing-theme-2-5': '10px',
  '--spacing-theme-3': '12px',
  '--spacing-theme-4': '16px',
  '--spacing-theme-5': '20px',
  '--spacing-theme-6': '24px',
  '--spacing-theme-8': '32px',
  '--spacing-theme-10': '40px',
  '--spacing-theme-12': '48px',
} as const;

type SpacingThemeVar = keyof typeof SPACING_THEME_VARS;
type SpacingThemeVars = typeof SPACING_THEME_VARS;

const getSpacingThemeVars = (): SpacingThemeVars => SPACING_THEME_VARS;

export { getSpacingThemeVars };
export type { SpacingThemeVar, SpacingThemeVars };
