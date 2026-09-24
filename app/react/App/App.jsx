import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Outlet, useLocation, useParams } from 'react-router';
import { useAtom, useAtomValue } from 'jotai';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v7';
import { Cookiepopup } from '#app/App/Cookiepopup.js';
import { Matomo, CleanInsights } from '#app/V2/Components/Analitycs/index.js';
import { settingsAtom } from '#V2/atoms/settingsAtom.js';
import { ThemeProvider } from '#V2/theme/ThemeProvider.js';
import { TranslateModal } from '#app/I18N/index.js';
import { inlineEditAtom } from '#V2/atoms/index.js';
import { NotificationsPanel } from '#V2/Components/UI/Notifications/NotificationsPanel.js';
import { Header } from '#app/V2/Components/UI/Header/Header.js';
import { BertHost } from '#app/V2/Components/AIAssistant/BertHost.js';
import { Confirm } from './Confirm.js';
import { AppMainContext } from './AppMainContext.js';
import { GoogleAnalytics } from './GoogleAnalytics.js';
import { LegacyHeader } from './LegacyHeader.js';
import { isEntityPath, isEntityV2Path } from '#app/utils/entityViewerPaths.js';
import { isLibraryPath, isLibraryV2MountPath } from '#app/utils/libraryPaths.js';
import 'react-widgets/dist/css/react-widgets.css';
import 'bootstrap/dist/css/bootstrap.css';
import 'flag-icons/sass/flag-icons.scss';
import 'flowbite/dist/flowbite.min.css';
import 'flowbite';
import './styles/tailwind.css';
import './scss/styles.scss';

/** Soft-deploy mounts are always V2 chrome; flags only own the canonical paths. */
const isV2AppRoute = (pathname, { entityViewerV2, libraryV2 }) =>
  pathname.includes('/settings') ||
  isEntityV2Path(pathname) ||
  (entityViewerV2 && isEntityPath(pathname)) ||
  isLibraryV2MountPath(pathname) ||
  (libraryV2 && isLibraryPath(pathname));

const useAppShell = (pathname, settings) => {
  const shouldShowNewHeader = Boolean(settings.features?.newHeader);
  const isV2Route = isV2AppRoute(pathname, {
    entityViewerV2: Boolean(settings.features?.featureFlagEntityViewerv2),
    libraryV2: Boolean(settings.features?.featureFlagLibraryV2),
  });
  const isSettingsRoute = pathname.includes('/settings');
  return {
    shouldShowNewHeader,
    isV2Route,
    shellSharedTheme: shouldShowNewHeader && isV2Route,
    settingsThemePath: isSettingsRoute ? 'settings' : undefined,
  };
};

const useAppClassName = (pathname, languages, sharedId) => {
  const possibleLanguages = languages?.map(l => l.key) || [];
  const shouldAddAppClassName =
    ['/', ...possibleLanguages.map(lang => `/${lang}/`)].includes(pathname) ||
    pathname.match(/\/page\/.*\/.*/g) ||
    pathname.match(/\/entity\/.*/g);
  return shouldAddAppClassName && sharedId ? `pageId_${sharedId}` : '';
};

const renderAppMainTree = (appContext, confirmOptions) => (
  <NuqsAdapter>
    <AppMainContext.Provider value={appContext}>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <Confirm {...confirmOptions} />
      <Outlet />
      <GoogleAnalytics />
      <Matomo />
      <CleanInsights />
    </AppMainContext.Provider>
  </NuqsAdapter>
);

const App = ({ customParams }) => {
  const [inlineEditState] = useAtom(inlineEditAtom);
  const [confirmOptions, setConfirmOptions] = useState({});
  const settings = useAtomValue(settingsAtom);
  const location = useLocation();
  const params = useParams();
  const sharedId = params.sharedId || customParams?.sharedId;
  const appContext = useMemo(() => ({ confirm: setConfirmOptions }), []);
  const appClassName = useAppClassName(location.pathname, settings.languages, sharedId);
  const { shouldShowNewHeader, isV2Route, shellSharedTheme, settingsThemePath } = useAppShell(
    location.pathname,
    settings
  );

  return (
    <div id="app" className={appClassName}>
      <div className="content">
        {shellSharedTheme ? (
          <ThemeProvider
            path={settingsThemePath}
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
              {renderAppMainTree(appContext, confirmOptions)}
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
                <ThemeProvider path={settingsThemePath} style={{ width: '100%', height: '100%' }}>
                  {renderAppMainTree(appContext, confirmOptions)}
                </ThemeProvider>
              ) : (
                renderAppMainTree(appContext, confirmOptions)
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
        <BertHost />
        <NotificationsPanel />
        <Cookiepopup />
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
