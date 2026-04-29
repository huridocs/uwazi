import React, { useMemo } from 'react';
import { useOutlet } from 'react-router';
import { Helmet } from 'react-helmet';
import { t } from '#app/I18N/index.js';
import { SettingsNavigation } from './SettingsNavigation.js';

const Settings = () => {
  const outlet = useOutlet();
  const isSettingsParentRoute = useMemo(() => outlet === null, [outlet]);
  return (
    <div className="flex w-full h-full">
      <Helmet>
        <title>{t('System', 'Settings', null, false)}</title>
      </Helmet>
      <div
        className={`md:min-w-[250px] h-full ${isSettingsParentRoute ? 'w-full' : 'invisible w-0 min-w-0'} md:visible`}
        style={{
          borderRight:
            '1px solid color-mix(in srgb, var(--color-theme-border-default) 42%, transparent)',
          backgroundColor:
            'var(--color-theme-chrome-settings-rail-bg, var(--color-theme-surface-muted))',
        }}
      >
        <SettingsNavigation />
      </div>
      <div className="relative flex-1 overflow-auto h-full">{outlet}</div>
    </div>
  );
};

export { Settings };
