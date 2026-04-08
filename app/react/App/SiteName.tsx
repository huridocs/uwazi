import React from 'react';
import { useAtomValue } from 'jotai';
import { Helmet } from 'react-helmet';
import { I18NLink } from '#app/I18N/index.js';
import { settingsAtom } from '#V2/atoms/index.js';

interface SiteNameProps {
  className?: string;
}

export const SiteName: React.FC<SiteNameProps> = ({ className = '' }) => {
  const {
    site_name: siteName,
    site_logo: siteLogo,
    themeCustomization,
  } = useAtomValue(settingsAtom);
  const logoUrl = siteLogo?.trim() ?? '';
  const showLogo = Boolean(themeCustomization && logoUrl);
  const linkClass = ['flex', 'items-center', 'gap-2', className].filter(Boolean).join(' ');
  return (
    <>
      <Helmet
        titleTemplate={`%s • ${siteName}`}
        meta={[{ charSet: 'utf-8' }, { name: 'description', content: 'Uwazi docs' }]}
      />
      <I18NLink className={linkClass} to="/">
        {showLogo ? (
          <img
            src={logoUrl}
            alt=""
            className="max-h-8 w-auto max-w-[200px] shrink-0 object-contain"
          />
        ) : null}
        <span>{siteName}</span>
      </I18NLink>
    </>
  );
};
