import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Outlet, useLocation, useParams } from 'react-router';
import { useAtom, useAtomValue } from 'jotai';
import { Cookiepopup } from '#app/App/Cookiepopup.js';
import { Matomo, CleanInsights } from '#app/V2/Components/Analitycs/index.js';
import { settingsAtom } from '#V2/atoms/settingsAtom.js';
import { ThemeProvider } from '#V2/theme/ThemeProvider.js';
import { TranslateModal } from '#app/I18N/index.js';
import { inlineEditAtom } from '#V2/atoms/index.js';
import { NotificationsPanel } from '#V2/Components/UI/Notifications/NotificationsPanel.js';
import { Header } from '#app/V2/Components/UI/Header/Header.js';
import { Confirm } from './Confirm.js';
import { AppMainContext } from './AppMainContext.js';
import { GoogleAnalytics } from './GoogleAnalytics.js';
import { LegacyHeader } from './LegacyHeader.js';
import 'react-widgets/dist/css/react-widgets.css';
import 'bootstrap/dist/css/bootstrap.css';
import 'flag-icons/sass/flag-icons.scss';
import 'flowbite/dist/flowbite.min.css';
import 'flowbite';
import './styles/tailwind.css';
import './scss/styles.scss';

const App = ({ customParams }) => {
  const [inlineEditState] = useAtom(inlineEditAtom);
  const [confirmOptions, setConfirmOptions] = useState({});
  const settings = useAtomValue(settingsAtom);
  const location = useLocation();
  const params = useParams();
  const sharedId = params.sharedId || customParams?.sharedId;

  const possibleLanguages = useMemo(
    () => settings.languages?.map(l => l.key) || [],
    [settings.languages]
  );
  const shouldAddAppClassName =
    ['/', ...possibleLanguages.map(lang => `/${lang}/`)].includes(location.pathname) ||
    location.pathname.match(/\/page\/.*\/.*/g) ||
    location.pathname.match(/\/entity\/.*/g);

  const shouldShowNewHeader = Boolean(settings.features?.newHeader);

  const confirm = options => {
    setConfirmOptions(options);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const appContext = useMemo(() => ({ confirm }));

  const appClassName = shouldAddAppClassName && sharedId ? `pageId_${sharedId}` : '';

  const isV2Route =
    location.pathname.includes('/entityv2') || location.pathname.includes('/settings');
  const shellSharedTheme = shouldShowNewHeader && isV2Route;

  const appMainTree = (
    <AppMainContext.Provider value={appContext}>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <Confirm {...confirmOptions} />
      <Outlet />
      <GoogleAnalytics />
      <Matomo />
      <CleanInsights />
    </AppMainContext.Provider>
  );

  return (
    <div id="app" className={appClassName}>
      <Cookiepopup />
      <div className="content">
        {shellSharedTheme ? (
          <ThemeProvider
            style={{
              flex: 1,
              minHeight: 0,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Header />
            <main id="main" className="app-content" style={{ flex: 1, minHeight: 0 }}>
              {appMainTree}
            </main>
          </ThemeProvider>
        ) : (
          <>
            {shouldShowNewHeader ? (
              <ThemeProvider style={{ width: '100%' }}>
                <Header />
              </ThemeProvider>
            ) : (
              <LegacyHeader />
            )}
            <main id="main" className={`app-content ${isV2Route ? '' : 'container-fluid'}`}>
              {isV2Route ? (
                <ThemeProvider style={{ width: '100%', height: '100%' }}>
                  {appMainTree}
                </ThemeProvider>
              ) : (
                appMainTree
              )}
            </main>
          </>
        )}
      </div>
      {inlineEditState.inlineEdit && inlineEditState.context && (
        <ThemeProvider>
          <TranslateModal />
        </ThemeProvider>
      )}
      <ThemeProvider>
        <NotificationsPanel />
      </ThemeProvider>
    </div>
  );
};

App.propTypes = {
  customParams: PropTypes.shape({
    sharedId: PropTypes.string,
  }),
};

export { App };
