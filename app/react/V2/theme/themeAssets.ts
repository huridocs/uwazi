import type { ThemeMode } from './tokens.js';
import type { ThemeVarsInput } from './themeThemeVars.js';
import { getEffectiveThemeVars, getPresetId } from './themeThemeVars.js';

type ThemeAssetId = 'siteLogo' | 'favicon';
type ThemeAssetPresetId = 'default' | 'legacy';
type ThemeAssets = {
  preset?: ThemeAssetPresetId;
  siteLogo?: Partial<Record<ThemeMode, string>>;
  favicon?: Partial<Record<ThemeMode, string>>;
};

type GetThemeAssetInput = {
  themeAssets: ThemeAssets | undefined;
  themeVars: ThemeVarsInput;
  mode: ThemeMode;
  asset: ThemeAssetId;
  fallback?: string;
  themeCustomizationEnabled?: boolean;
};

const THEME_ASSET_PRESETS: Record<
  ThemeAssetPresetId,
  Record<ThemeMode, Record<ThemeAssetId, string>>
> = {
  legacy: {
    light: {
      siteLogo: '/public/logo.svg',
      favicon: '/public/favicon.ico',
    },
    dark: {
      siteLogo: '/public/logo.svg',
      favicon: '/public/favicon.ico',
    },
  },
  default: {
    light: {
      siteLogo: '/public/uwazi-design-logo.svg',
      favicon: '/public/uwazi-design-icon-light.png',
    },
    dark: {
      siteLogo: '/public/uwazi-design-logo.svg',
      favicon: '/public/uwazi-design-icon-dark.png',
    },
  },
};

const getEffectiveThemeAssets = (
  themeAssets: ThemeAssets | undefined,
  themeCustomizationEnabled: boolean
) => (themeCustomizationEnabled ? themeAssets : undefined);

const getThemeAssetPresetId = (
  themeAssets: ThemeAssets | undefined,
  themeVars: ThemeVarsInput,
  themeCustomizationEnabled: boolean
): ThemeAssetPresetId => {
  const effectiveThemeAssets = getEffectiveThemeAssets(themeAssets, themeCustomizationEnabled);
  const effectiveThemeVars = getEffectiveThemeVars(themeVars, themeCustomizationEnabled);

  if (effectiveThemeAssets?.preset === 'default' || effectiveThemeAssets?.preset === 'legacy') {
    return effectiveThemeAssets.preset;
  }
  const currentPreset = getPresetId(effectiveThemeVars, themeCustomizationEnabled);
  return currentPreset === 'legacy' ? 'legacy' : 'default';
};

const getThemeAsset = ({
  themeAssets,
  themeVars,
  mode,
  asset,
  fallback,
  themeCustomizationEnabled = true,
}: GetThemeAssetInput): string =>
  getEffectiveThemeAssets(themeAssets, themeCustomizationEnabled)?.[asset]?.[mode] ??
  THEME_ASSET_PRESETS[getThemeAssetPresetId(themeAssets, themeVars, themeCustomizationEnabled)][
    mode
  ][asset] ??
  fallback ??
  '';

export { getThemeAsset, getThemeAssetPresetId };
export type { ThemeAssetId, ThemeAssetPresetId, ThemeAssets };
