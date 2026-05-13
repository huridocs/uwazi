const COMPONENT_LAYOUT_THEME_VARS = {
  '--layout-tab-padding-inline': 'var(--spacing-theme-3)',
  '--layout-tab-padding-inline-sm': 'var(--spacing-theme-2-5)',
  '--layout-tab-padding-block': 'var(--spacing-theme-1-5)',
  '--layout-segmented-border': '1px solid var(--color-theme-border-default)',
  '--layout-segmented-shadow': 'var(--color-theme-shadow-sm)',
  '--layout-segmented-divider': 'var(--color-theme-border-default)',
} as const;

type ComponentLayoutThemeVar = keyof typeof COMPONENT_LAYOUT_THEME_VARS;
type ComponentLayoutThemeVars = typeof COMPONENT_LAYOUT_THEME_VARS;

const getComponentLayoutThemeVars = (): ComponentLayoutThemeVars => COMPONENT_LAYOUT_THEME_VARS;

export { getComponentLayoutThemeVars };
export type { ComponentLayoutThemeVar, ComponentLayoutThemeVars };
