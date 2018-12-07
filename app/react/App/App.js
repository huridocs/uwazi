import fetch from 'isomorphic-fetch';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import 'bootstrap/dist/css/bootstrap.css';
import 'react-widgets/lib/scss/react-widgets.scss';
import 'nprogress/nprogress.css';
import Notifications from 'app/Notifications';
import { TranslateForm } from 'app/I18N';

import { loadIcons } from 'UI/Icon/library';
import { Icon } from 'UI';

import './scss/styles.scss';

import Menu from './Menu';
import SiteName from './SiteName';
import Confirm from './Confirm';
import GoogleAnalytics from './GoogleAnalytics';
import Matomo from './Matomo';

loadIcons();

class App extends Component {
  constructor(props, context) {
    super(props, context);

    // change fetch to use api and test it properly
    this.fetch = props.fetch || fetch;
    this.state = { showmenu: false, confirmOptions: {} };

    this.toggleMenu = this.toggleMenu.bind(this);
  }

  getChildContext() {
    return {
      confirm: this.confirm.bind(this)
    };
  }

  toggleMenu() {
    this.setState({ showmenu: !this.state.showmenu });
  }

  closeMenu() {
    this.setState({ showmenu: false });
  }

  confirm(options) {
    this.setState({ confirmOptions: options });
  }

  renderTools() {
    return React.Children.map(this.props.children, (child) => {
      //condition not tested
      if (child.type.renderTools) {
        return child.type.renderTools();
      }

      return undefined;
    });
  }

  render() {
    let MenuButtonIcon = 'bars';
    let navClass = 'menuNav';

    if (this.state.showmenu) {
      MenuButtonIcon = 'times';
      navClass += ' is-active';
    }

    const customHomePageId = this.props.routes.reduce((memo, route) => {
      if (Object.keys(route).includes('customHomePageId')) {
        return route.customHomePageId;
      }
      return memo;
    }, '');


    const pageId = this.props.params && this.props.params.pageId ? this.props.params.pageId : '';

    const appClassName = customHomePageId || pageId ? `pageId_${customHomePageId || pageId}` : '';

    return (
      <div id="app" className={appClassName}>
        <Notifications />
        <div className="content">
          <nav>
            <h1><SiteName/></h1>
          </nav>
          <header>
            <button className="menu-button" onClick={this.toggleMenu}>
              <Icon icon={MenuButtonIcon} />
            </button>
            <h1 className="logotype"><SiteName/></h1>
            {this.renderTools()}
            <Menu language={this.context.language} location={this.props.location} onClick={this.toggleMenu} className={navClass} />
          </header>
          <div className="app-content container-fluid">
            <Confirm {...this.state.confirmOptions}/>
            <TranslateForm/>
            {this.props.children}
            <GoogleAnalytics/>
            <Matomo/>
          </div>
        </div>
      </div>
    );
  }
}

App.defaultProps = {
  params: {},
  routes: [],
};

App.propTypes = {
  fetch: PropTypes.func,
  children: PropTypes.object,
  location: PropTypes.object,
  params: PropTypes.object,
  routes: PropTypes.array,
};

App.childContextTypes = {
  confirm: PropTypes.func,
  locale: PropTypes.string
};

App.contextTypes = {
  getUser: PropTypes.func,
  router: PropTypes.object,
  language: PropTypes.string,
};

export default App;
