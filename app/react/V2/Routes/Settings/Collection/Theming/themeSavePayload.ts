import { UseFormSetValue } from 'react-hook-form';
import { ClientSettings } from '#app/apiResponseTypes.js';
import { ThemeAssets } from '#V2/theme/themes.js';

const trimmed = (value: string | undefined) => value?.trim() ?? '';

const buildThemeSavePayload = (
  themeVars: ClientSettings['themeVars'],
  themeAssets: ThemeAssets
): Pick<ClientSettings, 'themeVars' | 'themeAssets' | 'site_logo' | 'favicon'> => ({
  themeVars,
  themeAssets,
  site_logo: trimmed(themeAssets.siteLogo?.light),
  favicon: trimmed(themeAssets.favicon?.light),
});

const savedThemeFields = (
  saved: Pick<ClientSettings, 'themeVars' | 'themeAssets' | 'site_logo' | 'favicon'>
) => ({
  themeVars: saved.themeVars ?? {},
  themeAssets: saved.themeAssets ?? {},
  site_logo: saved.site_logo ?? '',
  favicon: saved.favicon ?? '',
});

const applySavedTheme = (
  saved: Pick<ClientSettings, 'themeVars' | 'themeAssets' | 'site_logo' | 'favicon'>,
  setValue: UseFormSetValue<ClientSettings>
) => {
  const fields = savedThemeFields(saved);
  setValue('themeVars', fields.themeVars);
  setValue('themeAssets', fields.themeAssets);
  setValue('site_logo', fields.site_logo);
  setValue('favicon', fields.favicon);
};

export { applySavedTheme, buildThemeSavePayload, savedThemeFields };
