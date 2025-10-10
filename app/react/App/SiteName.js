import React from 'react';
import { useAtomValue } from 'jotai';
import { Helmet } from 'react-helmet';
import { I18NLink } from 'app/I18N';
import { settingsAtom } from 'V2/atoms';

export const SiteName = () => {
  const { site_name: siteName } = useAtomValue(settingsAtom);

  return (
    <div>
      <Helmet
        titleTemplate={`%s • ${siteName}`}
        meta={[{ 'char-set': 'utf-8' }, { name: 'description', content: 'Uwazi docs' }]}
      />
      <I18NLink to="/">{siteName}</I18NLink>
    </div>
  );
};

export default SiteName;
