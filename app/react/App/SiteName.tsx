import React from 'react';
import { useAtomValue } from 'jotai';
import { Helmet } from 'react-helmet';
import { I18NLink } from '#app/I18N/index.js';
import { effectiveThemeModeAtom, settingsAtom } from '#V2/atoms/index.js';
import { getThemeAsset } from '#V2/theme/themes.js';

interface SiteNameProps {
  className?: string;
  textClassName?: string;
  hideTextWhenLogo?: boolean;
}

const WORDMARK_ASPECT_RATIO = 4;
const SQUARE_LOGO_ASPECT_RATIO = 1.5;

type LogoSize = 'wordmark' | 'square' | 'rectangle';

const LOGO_SIZE_CLASSES: Record<LogoSize, string> = {
  wordmark: 'h-logo',
  square: 'max-h-12',
  rectangle: 'max-h-7 sm:max-h-8',
};

const getLogoSize = (naturalWidth: number, naturalHeight: number): LogoSize => {
  const aspectRatio = naturalHeight === 0 ? WORDMARK_ASPECT_RATIO : naturalWidth / naturalHeight;

  if (aspectRatio >= WORDMARK_ASPECT_RATIO) return 'wordmark';

  return aspectRatio <= SQUARE_LOGO_ASPECT_RATIO ? 'square' : 'rectangle';
};

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
  const [logoSize, setLogoSize] = React.useState<LogoSize>('wordmark');
  const themeMode = useAtomValue(effectiveThemeModeAtom);
  const themeCustomizationEnabled = Boolean(themeCustomization);
  const fallbackLogoUrl = siteLogo?.trim() ?? '';
  const fallbackFaviconUrl = favicon?.trim() ?? '';
  const logoUrl = getThemeAsset(
    themeAssets,
    themeVars,
    themeMode,
    'siteLogo',
    fallbackLogoUrl,
    themeCustomizationEnabled
  );
  const faviconUrl = getThemeAsset(
    themeAssets,
    themeVars,
    themeMode,
    'favicon',
    fallbackFaviconUrl,
    themeCustomizationEnabled
  );
  React.useEffect(() => {
    setLogoSize('wordmark');
  }, [logoUrl]);
  const showLogo = Boolean(themeCustomization && logoUrl);
  const showText = !hideTextWhenLogo || !showLogo;
  const linkClass = ['flex', 'items-center', 'gap-2', className].filter(Boolean).join(' ');
  const logoClassName = [
    'logo-img w-auto max-w-[8rem] shrink-0 object-contain sm:max-w-[10rem] lg:max-w-[12.5rem]',
    LOGO_SIZE_CLASSES[logoSize],
  ].join(' ');
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
      <I18NLink className={linkClass} to="/" aria-label={siteName}>
        {showLogo ? (
          <img
            src={logoUrl}
            alt=""
            className={logoClassName}
            onLoad={event => {
              const { naturalWidth, naturalHeight } = event.currentTarget;
              setLogoSize(getLogoSize(naturalWidth, naturalHeight));
            }}
          />
        ) : null}
        {showText ? <span className={textClassName}>{siteName}</span> : null}
      </I18NLink>
    </>
  );
};
