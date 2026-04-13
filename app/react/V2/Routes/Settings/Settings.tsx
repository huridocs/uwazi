import React, { useMemo } from 'react';
import { useOutlet } from 'react-router';
import { Helmet } from 'react-helmet';
import { t } from '#app/I18N/index.js';
import { ThemeProvider } from '#V2/theme/ThemeProvider.js';
import { SettingsNavigation } from './SettingsNavigation.js';

const Settings = () => {
  const outlet = useOutlet();
  const isSettingsParentRoute = useMemo(() => outlet === null, [outlet]);
  return (
    <ThemeProvider style={{ display: 'flex', width: '100%', height: '100%' }}>
      <Helmet>
        <title>{t('System', 'Settings', null, false)}</title>
      </Helmet>
      <div
        className={`md:min-w-[250px] h-full ${isSettingsParentRoute ? 'w-full' : 'invisible w-0 min-w-0'} md:visible`}
        style={{
          borderRight:
            '1px solid color-mix(in srgb, var(--color-theme-border-default) 40%, transparent)',
          backgroundColor: 'var(--color-theme-surface-muted)',
        }}
      >
        <SettingsNavigation />
      </div>
      <div className="flex-1 overflow-auto h-full">{outlet}</div>
    </ThemeProvider>
  );
};

export { Settings };
