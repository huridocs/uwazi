import React, { useMemo } from 'react';
import { useOutlet } from 'react-router';
import { Helmet } from 'react-helmet';

import { t } from '#app/I18N/index.js';
import { SettingsNavigation } from './SettingsNavigation';

const Settings = () => {
  const outlet = useOutlet();
  const isSettingsParentRoute = useMemo(() => outlet === null, [outlet]);
  return (
    <div
      className="tw-content"
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
      }}
    >
      <Helmet>
        <title>{t('System', 'Settings', null, false)}</title>
      </Helmet>
      <div
        className={`md:min-w-[250px] border-r border-gray-200 bg-gray-50 h-full ${isSettingsParentRoute ? 'w-full' : 'invisible w-0 min-w-0'} md:visible`}
      >
        <SettingsNavigation />
      </div>
      <div className="flex-1 overflow-auto h-full">{outlet}</div>
    </div>
  );
};

export { Settings };
