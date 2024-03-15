import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Outlet, useLocation, useParams } from 'react-router-dom';
import { useSetRecoilState } from 'recoil';
import Notifications from 'app/Notifications';
import Cookiepopup from 'app/App/Cookiepopup';
import { TranslateForm, t } from 'app/I18N';
import { Icon } from 'UI';

import { socket } from 'app/socket';
import { NotificationsContainer } from 'V2/Components/UI';
import { settingsAtom } from 'app/V2/atoms/settingsAtom';
import Confirm from './Confirm';
import { Menu } from './Menu';
import { AppMainContext } from './AppMainContext';
import SiteName from './SiteName';
import GoogleAnalytics from './GoogleAnalytics';
import { Matomo } from './Matomo';
import 'react-widgets/dist/css/react-widgets.css';
import 'bootstrap/dist/css/bootstrap.css';
import 'nprogress/nprogress.css';
import 'flag-icon-css/sass/flag-icons.scss';
import './scss/styles.scss';
import './styles/globals.css';
import 'flowbite';

const App = ({ customParams }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [confirmOptions, setConfirmOptions] = useState({});
  const setSettings = useSetRecoilState(settingsAtom);

  const location = useLocation();
  const params = useParams();
  const sharedId = params.sharedId || customParams?.sharedId;
  const shouldAddAppClassName =
    ['/', `/${params.lang}/`].includes(location.pathname) ||
    location.pathname.match(/\/page\/.*\/.*/g) ||
    location.pathname.match(/\/entity\/.*/g);

  const toggleMobileMenu = visible => {
    setShowMenu(visible);
  };

  const confirm = options => {
    setConfirmOptions(options);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const appContext = useMemo(() => ({ confirm }));

  let MenuButtonIcon = 'bars';
  let navClass = 'menuNav';

  if (showMenu) {
    MenuButtonIcon = 'times';
    navClass += ' is-active';
  }

  const appClassName = shouldAddAppClassName && sharedId ? `pageId_${sharedId}` : '';

  socket.on('updateSettings', settings => {
    setSettings(settings);
  });

  return (
    <div id="app" className={appClassName}>
      <Notifications />
      <Cookiepopup />
      <div className="content">
        <nav className="library-nav">
          <h1>
            <SiteName />
          </h1>
        </nav>
        <header>
          <button
            className="menu-button"
            onClick={() => toggleMobileMenu(MenuButtonIcon === 'bars')}
            type="button"
            aria-label={t('System', 'Menu', null, false)}
          >
            <Icon icon={MenuButtonIcon} />
          </button>
          <h1 className="logotype">
            <SiteName />
          </h1>
          <Menu location={location} toggleMobileMenu={toggleMobileMenu} className={navClass} />
          <div className="nprogress-container" />
        </header>
        <main className="app-content container-fluid">
          <AppMainContext.Provider value={appContext}>
            <Confirm {...confirmOptions} />
            <TranslateForm />
            <Outlet />
            <GoogleAnalytics />
            <Matomo />
          </AppMainContext.Provider>
        </main>
      </div>
      <NotificationsContainer />
    </div>
  );
};

App.propTypes = {
  customParams: PropTypes.shape({
    sharedId: PropTypes.string,
  }),
};

export { App };
