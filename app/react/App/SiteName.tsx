import React from 'react';
import { useAtomValue } from 'jotai';
import { Helmet } from 'react-helmet';
import { I18NLink } from '#app/I18N/index.js';
import { settingsAtom, themeModeAtom } from '#V2/atoms/index.js';
import { getThemeAsset } from '#V2/theme/themes.js';

interface SiteNameProps {
  className?: string;
  textClassName?: string;
  hideTextWhenLogo?: boolean;
}

export const SiteName: React.FC<SiteNameProps> = ({
  className = '',
  textClassName = '',
  hideTextWhenLogo = false,
}) => {
  const {
    site_name: siteName,
    site_logo: siteLogo,
    favicon,
    themeAssets,
    themeVars,
    themeCustomization,
  } = useAtomValue(settingsAtom);
  const themeMode = useAtomValue(themeModeAtom);
  const themeCustomizationEnabled = Boolean(themeCustomization);
  const fallbackLogoUrl = siteLogo?.trim() ?? '';
  const fallbackFaviconUrl = favicon?.trim() ?? '';
  const logoUrl = themeCustomizationEnabled
    ? getThemeAsset(themeAssets, themeVars, themeMode, 'siteLogo', fallbackLogoUrl, true)
    : fallbackLogoUrl;
  const faviconUrl = themeCustomizationEnabled
    ? getThemeAsset(themeAssets, themeVars, themeMode, 'favicon', fallbackFaviconUrl, true)
    : fallbackFaviconUrl;
  const showLogo = Boolean(themeCustomization && logoUrl);
  const showText = !hideTextWhenLogo || !showLogo;
  const linkClass = ['flex', 'items-center', 'gap-2', className].filter(Boolean).join(' ');
  return (
    <>
      <Helmet
        titleTemplate={`%s • ${siteName}`}
        meta={[{ charSet: 'utf-8' }, { name: 'description', content: 'Uwazi docs' }]}
        link={
          faviconUrl
            ? [
                { rel: 'icon', href: faviconUrl },
                { rel: 'shortcut icon', href: faviconUrl },
              ]
            : undefined
        }
      />
      <I18NLink className={linkClass} to="/">
        {showLogo ? (
          <img
            src={logoUrl}
            alt=""
            className="logo-img max-h-7 w-auto max-w-[8rem] shrink-0 object-contain sm:max-h-8 sm:max-w-[10rem] lg:max-w-[12.5rem]"
          />
        ) : null}
        {showText ? <span className={textClassName}>{siteName}</span> : null}
      </I18NLink>
    </>
  );
};
