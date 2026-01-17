/* eslint-disable import/no-named-as-default */
import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Outlet, useLocation, useParams } from 'react-router';
import { useAtom } from 'jotai';
import Notifications from '#app/Notifications/index.js';
import Cookiepopup from '#app/App/Cookiepopup.tsx';
import { Icon } from '#app/V2/Components/UI/index.js';
import { socket } from '#app/socket.js';
import { NotificationsContainer } from '#app/V2/Components/UI/NotificationsContainer.jsx';
import { Matomo, CleanInsights } from '#app/V2/Components/Analitycs/index.ts';
import { settingsAtom } from '#app/V2/atoms/settingsAtom.ts';
import { TranslateModal, t } from '#app/I18N/TranslateModal.tsx';
import Confirm from '#app/App/Confirm.jsx';
import { Menu } from '#app/App/Menu.jsx';
import { AppMainContext } from '#app/App/AppMainContext.ts';
import SiteName from '#app/App/SiteName.jsx';
import GoogleAnalytics from '#app/App/GoogleAnalytics.jsx';
import 'react-widgets/dist/css/react-widgets.css';
import 'bootstrap/dist/css/bootstrap.css';
import 'nprogress/nprogress.css';
import 'flag-icons/sass/flag-icons.scss';
import 'flowbite/dist/flowbite.min.css';
import 'flowbite';
import './styles/tailwind.css';
import './scss/styles.scss';
import { inlineEditAtom } from '#app/V2/atoms/translationsAtoms.ts';

const App = ({ customParams }) => {
  const [inlineEditState] = useAtom(inlineEditAtom);
  const [confirmOptions, setConfirmOptions] = useState({});
  const [settings, setSettings] = useAtom(settingsAtom);
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

  //TODO: Remove this once the new header is ready
  const shouldShowNewHeader = false;
  //const shouldShowNewHeader = location.pathname.includes('/settings') || location.pathname.includes('/v2');

  const confirm = options => {
    setConfirmOptions(options);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const appContext = useMemo(() => ({ confirm }));

  const appClassName = shouldAddAppClassName && sharedId ? `pageId_${sharedId}` : '';

  const isV2Route =
    location.pathname.includes('/entityv2') || location.pathname.includes('/settings');

  socket.on('updateSettings', _settings => {
    setSettings(_settings);
  });

  return (
    <div id="app" className={appClassName}>
      <Notifications />
      <Cookiepopup />
      <div className="content">
        {shouldShowNewHeader ? (
          <div className="tw-content">
            <Header />
          </div>
        ) : (
          <LegacyHeader />
        )}
        <main id="main" className={`app-content ${isV2Route ? '' : 'container-fluid'}`}>
          <AppMainContext.Provider value={appContext}>
            {/* eslint-disable-next-line react/jsx-props-no-spreading */}
            <Confirm {...confirmOptions} />
            <Outlet />
            <GoogleAnalytics />
            <Matomo />
            <CleanInsights />
          </AppMainContext.Provider>
        </main>
      </div>
      <NotificationsContainer />
      {inlineEditState.inlineEdit && inlineEditState.context && <TranslateModal />}
    </div>
  );
};

App.propTypes = {
  customParams: PropTypes.shape({
    sharedId: PropTypes.string,
  }),
};

export { App };
