import React from 'react';
import { useAtomValue } from 'jotai';
import { Helmet } from 'react-helmet';
import { I18NLink } from '#app/I18N/index.js';
import { effectiveThemeModeAtom, settingsAtom } from '#V2/atoms/index.js';
import { useTrimmedLogo, useLogoFrame } from '#V2/theme/logoFrame.js';
import { getThemeAsset } from '#V2/theme/themes.js';

interface SiteNameProps {
  className?: string;
  textClassName?: string;
  hideTextWhenLogo?: boolean;
}

const useCollectionMarks = () => {
  const settings = useAtomValue(settingsAtom);
  const themeMode = useAtomValue(effectiveThemeModeAtom);
  const enabled = Boolean(settings.themeCustomization);
  return { settings, themeMode, enabled };
};

const useSiteHeaderLogo = (logoUrl: string, enabled: boolean) => {
  const showLogo = Boolean(enabled && logoUrl);
  const logo = useLogoFrame(logoUrl);
  const displayLogo = useTrimmedLogo(showLogo ? logoUrl : undefined);
  return { showLogo, className: logo.className, displayLogo };
};

export const SiteName: React.FC<SiteNameProps> = ({
  className = '',
  textClassName = '',
  hideTextWhenLogo = false,
}) => {
  const { settings, themeMode, enabled } = useCollectionMarks();
  const logoUrl = getThemeAsset(
    settings.themeAssets,
    settings.themeVars,
    themeMode,
    'siteLogo',
    settings.site_logo?.trim() ?? '',
    enabled
  );
  const faviconUrl = getThemeAsset(
    settings.themeAssets,
    settings.themeVars,
    themeMode,
    'favicon',
    settings.favicon?.trim() ?? '',
    enabled
  );
  const logo = useSiteHeaderLogo(logoUrl, enabled);
  const showText = !hideTextWhenLogo || !logo.showLogo;
  const linkClass = ['flex', 'items-center', 'gap-2', className].filter(Boolean).join(' ');
  return (
    <>
      <Helmet
        link={
          faviconUrl
            ? [
                { rel: 'icon', href: faviconUrl },
                { rel: 'shortcut icon', href: faviconUrl },
              ]
            : undefined
        }
      />
      <I18NLink className={linkClass} to="/" aria-label={settings.site_name}>
        {logo.showLogo ? <img src={logo.displayLogo} alt="" className={logo.className} /> : null}
        {showText ? <span className={textClassName}>{settings.site_name}</span> : null}
      </I18NLink>
    </>
  );
};
