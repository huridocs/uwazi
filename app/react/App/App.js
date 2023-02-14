import React, { useState, useMemo } from 'react';
import { Outlet, useLocation, useParams } from 'react-router-dom';
import Notifications from 'app/Notifications';
import Cookiepopup from 'app/App/Cookiepopup';
import { TranslateForm, t } from 'app/I18N';
import { Icon } from 'UI';
import Confirm from './Confirm';
import { Menu } from './Menu';
import { AppMainContext } from './AppMainContext';
import SiteName from './SiteName';
import GoogleAnalytics from './GoogleAnalytics';
import Matomo from './Matomo';
import 'bootstrap/dist/css/bootstrap.css';
import 'react-widgets/lib/scss/react-widgets.scss';
import 'nprogress/nprogress.css';
import 'flag-icon-css/sass/flag-icons.scss';
import './scss/styles.scss';

const App = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [confirmOptions, setConfirmOptions] = useState({});
  const location = useLocation();
  const params = useParams();

  const toggleMobileMenu = visible => {
    setShowMenu(visible);
  };

  const confirm = options => {
    setConfirmOptions(options);
  };

  const appContext = useMemo(() => ({ confirm }));

  let MenuButtonIcon = 'bars';
  let navClass = 'menuNav';

  if (showMenu) {
    MenuButtonIcon = 'times';
    navClass += ' is-active';
  }

  const appClassName = params.sharedId ? `pageId_${params.sharedId}` : '';

  return (
    <div id="app" className={appClassName}>
      <Notifications />
      <Cookiepopup />
      <div className="content">
        <nav>
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
        </header>
        <div className="app-content container-fluid">
          <AppMainContext.Provider value={appContext}>
            <Confirm {...confirmOptions} />
            <TranslateForm />
            <Outlet />
            <GoogleAnalytics />
            <Matomo />
          </AppMainContext.Provider>
        </div>
      </div>
    </div>
  );
};

export { App };
