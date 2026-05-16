import { getRelativeLuminanceFromHex, mixHex, parseColorToHex } from '#shared/utils/contrast.js';
import { PRESET_DEFINITIONS, type ResolvedThemeVars, type ThemeMode } from '#V2/theme/tokens.js';

const parseThemeColorHex = (value: string | undefined): string | null =>
  value ? parseColorToHex(value.trim()) : null;

const getTemplatePillThemeAnchors = (
  themeColors: ResolvedThemeVars,
  mode: ThemeMode,
  templateColorRaw?: string | null
): { tintBase: string; accentHex: string } => {
  const presetFallback = PRESET_DEFINITIONS.default.modes[mode];

  const defaultAccent =
    parseThemeColorHex(themeColors['--color-theme-accent-supporting']) ??
    parseThemeColorHex(themeColors['--color-theme-accent-primary']) ??
    parseThemeColorHex(presetFallback['--color-theme-accent-supporting']) ??
    presetFallback['--color-theme-accent-supporting'];

  const accentHex = parseThemeColorHex(templateColorRaw ?? undefined) ?? defaultAccent;

  const neutralRaw =
    mode === 'light'
      ? (parseThemeColorHex(themeColors['--color-theme-bg-warm']) ??
        parseThemeColorHex(themeColors['--color-theme-bg-primary']) ??
        parseThemeColorHex(presetFallback['--color-theme-bg-primary']) ??
        '#FFFFFF')
      : (parseThemeColorHex(themeColors['--color-theme-bg-warm']) ??
        parseThemeColorHex(themeColors['--color-theme-bg-surface']) ??
        parseThemeColorHex(presetFallback['--color-theme-bg-surface']) ??
        '#1F2937');

  const lightPrimary =
    parseThemeColorHex(presetFallback['--color-theme-bg-primary']) ??
    parseThemeColorHex(presetFallback['--color-theme-bg-surface']) ??
    '#FFFFFF';

  const neutral =
    mode === 'light' && getRelativeLuminanceFromHex(neutralRaw) < 0.55 ? lightPrimary : neutralRaw;

  const tintBase = mixHex(neutral, accentHex, mode === 'light' ? 0.12 : 0.2);

  const safeTintBase =
    mode === 'light' && getRelativeLuminanceFromHex(tintBase) < 0.45 ? lightPrimary : tintBase;

  return { tintBase: safeTintBase, accentHex };
};

export { getTemplatePillThemeAnchors };
