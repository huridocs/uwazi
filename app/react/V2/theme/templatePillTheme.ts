import { parseColorToHex } from '#shared/utils/contrast.js';
import { PRESET_DEFINITIONS, type ResolvedThemeVars, type ThemeMode } from '#V2/theme/tokens.js';

const parseThemeColorHex = (value: string | undefined): string | null =>
  value ? parseColorToHex(value.trim()) : null;

const getTemplatePillThemeAnchors = (
  themeColors: ResolvedThemeVars,
  mode: ThemeMode
): { tintBase: string; defaultAccent: string } => {
  const presetFallback = PRESET_DEFINITIONS.default.modes[mode];
  const tintBase =
    parseThemeColorHex(themeColors['--color-theme-bg-warm']) ??
    parseThemeColorHex(themeColors['--color-theme-bg-primary']) ??
    parseThemeColorHex(themeColors['--color-theme-bg-surface']) ??
    parseThemeColorHex(presetFallback['--color-theme-bg-warm']) ??
    parseThemeColorHex(presetFallback['--color-theme-bg-surface']) ??
    presetFallback['--color-theme-bg-surface'];

  const defaultAccent =
    parseThemeColorHex(themeColors['--color-theme-accent-supporting']) ??
    parseThemeColorHex(themeColors['--color-theme-accent-primary']) ??
    parseThemeColorHex(presetFallback['--color-theme-accent-supporting']) ??
    presetFallback['--color-theme-accent-supporting'];

  return { tintBase, defaultAccent };
};

export { getTemplatePillThemeAnchors, parseThemeColorHex };
