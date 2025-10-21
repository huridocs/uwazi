/* eslint-disable import/no-named-as-default */
import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Outlet, useLocation, useParams } from 'react-router';
import { useAtom } from 'jotai';
import Notifications from 'app/Notifications';
import Cookiepopup from 'app/App/Cookiepopup';
import { socket } from 'app/socket';
import { NotificationsContainer } from 'V2/Components/UI';
import { Matomo, CleanInsights } from 'app/V2/Components/Analitycs';
import { settingsAtom } from 'V2/atoms/settingsAtom';
import { TranslateModal } from 'app/I18N';
import { inlineEditAtom } from 'V2/atoms';
import { Header } from 'app/V2/Components/UI/Header/Header';
import Confirm from './Confirm';
import { AppMainContext } from './AppMainContext';
import GoogleAnalytics from './GoogleAnalytics';
import { LegacyHeader } from './LegacyHeader';
import 'react-widgets/dist/css/react-widgets.css';
import 'bootstrap/dist/css/bootstrap.css';
import 'nprogress/nprogress.css';
import 'flag-icons/sass/flag-icons.scss';
import './scss/styles.scss';
import './styles/globals.css';
import 'flowbite';

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
        <main id="main" className="app-content container-fluid">
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
