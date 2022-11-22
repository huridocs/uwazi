import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.css';
import 'react-widgets/lib/scss/react-widgets.scss';
import 'nprogress/nprogress.css';
import 'flag-icon-css/sass/flag-icons.scss';
import Notifications from 'app/Notifications';
import Cookiepopup from 'app/App/Cookiepopup';
import { TranslateForm, t } from 'app/I18N';
import { Icon } from 'UI';
import Confirm from './Confirm';
import './scss/styles.scss';
import Menu from './Menu';
import SiteName from './SiteName';
import GoogleAnalytics from './GoogleAnalytics';
import Matomo from './Matomo';

const App = () => {
  const [showmenu, setShowMenu] = useState(false);
  const [confirmOptions, setConfirmOptions] = useState({});
  const location = useLocation();
  // constructor(props, context) {
  //   super(props, context);
  //   this.state = { showmenu: false, confirmOptions: {} };

  //   this.toggleMenu = this.toggleMenu.bind(this);
  // }

  // const getChildContext = () => ({
  //   confirm: this.confirm.bind(this),
  // });

  const toggleMenu = () => {
    setShowMenu(!showmenu);
  };

  const confirm = options => {
    setConfirmOptions(options);
  };

  // const renderTools = () =>
  //   React.Children.map(this.props.children, child => {
  //     //condition not tested
  //     if (child.type.renderTools) {
  //       return child.type.renderTools();
  //     }

  //     return undefined;
  //   });
  //    const { routes, location, params } = this.props;
  let MenuButtonIcon = 'bars';
  let navClass = 'menuNav';

  if (showmenu) {
    MenuButtonIcon = 'times';
    navClass += ' is-active';
  }

  /* CHECK WITH ROUTES
  const customHomePageId = routes.reduce((memo, route) => {
    if (Object.keys(route).includes('customHomePageId')) {
      return route.customHomePageId;
    }
    return memo;
  }, '');

  const pageId = location.pathname.match('page/') && params.sharedId ? params.sharedId : '';

  const appClassName = customHomePageId || pageId ? `pageId_${customHomePageId || pageId}` : '';
*/
  return (
    <div id="app" className="">
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
            onClick={toggleMenu}
            type="button"
            aria-label={t('System', 'Menu', null, false)}
          >
            <Icon icon={MenuButtonIcon} />
          </button>
          <h1 className="logotype">
            <SiteName />
          </h1>
          {/* {this.renderTools()} */}
          <Menu location={location} onClick={toggleMenu} className={navClass} />
        </header>
        <div className="app-content container-fluid">
          <Confirm {...confirmOptions} />
          <TranslateForm />
          <Outlet />
          <GoogleAnalytics />
          <Matomo />
        </div>
      </div>
    </div>
  );
};

// App.defaultProps = {
//   params: {},
//   routes: [],
// };

// App.propTypes = {
//   fetch: PropTypes.func,
//   children: PropTypes.object,
//   location: PropTypes.object,
//   params: PropTypes.object,
//   routes: PropTypes.array,
// };

// App.childContextTypes = {
//   confirm: PropTypes.func,
//   locale: PropTypes.string,
// };

// App.contextTypes = {
//   getUser: PropTypes.func,
//   router: PropTypes.object,
// };

// export default App;

export { App };
