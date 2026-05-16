const TYPOGRAPHY_THEME_VARS = {
  '--font-theme-sans':
    'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Helvetica Neue, Arial, Noto Sans, sans-serif',
  '--font-theme-mono': 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, monospace',
  '--font-theme-size-xs': '12px',
  '--font-theme-size-sm': '13px',
  '--font-theme-size-base': '14px',
  '--font-theme-size-md': '16px',
  '--font-theme-line-tight': '1.2',
  '--font-theme-line-normal': '1.5',
  '--font-theme-weight-medium': '500',
  '--font-theme-weight-bold': '700',
} as const;

type TypographyThemeVar = keyof typeof TYPOGRAPHY_THEME_VARS;
type TypographyThemeVars = typeof TYPOGRAPHY_THEME_VARS;

const getTypographyThemeVars = (): TypographyThemeVars => TYPOGRAPHY_THEME_VARS;

export { getTypographyThemeVars };
export type { TypographyThemeVar, TypographyThemeVars };
