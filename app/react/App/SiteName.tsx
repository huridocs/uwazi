import React from 'react';
import { useAtomValue } from 'jotai';
import { Helmet } from 'react-helmet';
import { I18NLink } from 'app/I18N';
import { settingsAtom } from 'V2/atoms';

interface SiteNameProps {
  className?: string;
}

export const SiteName: React.FC<SiteNameProps> = ({ className = '' }) => {
  const { site_name: siteName } = useAtomValue(settingsAtom);
  return (
    <>
      <Helmet
        titleTemplate={`%s • ${siteName}`}
        meta={[{ charSet: 'utf-8' }, { name: 'description', content: 'Uwazi docs' }]}
      />
      <I18NLink className={className} to="/">
        {siteName}
      </I18NLink>
    </>
  );
};
