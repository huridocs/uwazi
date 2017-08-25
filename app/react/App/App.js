import fetch from 'isomorphic-fetch';
import PropTypes from 'prop-types';
import React, {Component} from 'react';

import 'bootstrap/dist/css/bootstrap.css';
//import 'font-awesome/css/font-awesome.css';
import 'react-widgets/lib/scss/react-widgets.scss';
import './scss/styles.scss';
import 'nprogress/nprogress.css';

import Notifications from 'app/Notifications';
import Menu from './Menu';
import SiteName from './SiteName';
import Confirm from './Confirm';
import GoogleAnalytics from './GoogleAnalytics';
import {isClient} from 'app/utils';
import {loadCSS} from 'fg-loadcss';

if (isClient) {
  loadCSS('https://opensource.keycdn.com/fontawesome/4.7.0/font-awesome.min.css');
  loadCSS('https://fonts.googleapis.com/css?family=Roboto+Mono:100,300,400,500,700|Roboto+Slab:100,300,400,700|Roboto:100,300,400,500,700,900');
}

class App extends Component {

  constructor(props, context) {
    super(props, context);
    // change fetch to use api and test it properly
    this.fetch = props.fetch || fetch;
    this.state = {showmenu: false, confirmOptions: {}};
  }

  getChildContext() {
    return {
      confirm: this.confirm.bind(this)
    };
  }

  toggleMenu() {
    this.setState({showmenu: !this.state.showmenu});
  }

  closeMenu() {
    this.setState({showmenu: false});
  }

  confirm(options) {
    this.setState({confirmOptions: options});
  }

  renderTools() {
    return React.Children.map(this.props.children, (child) => {
      //condition not tested
      if (child.type.renderTools) {
        return child.type.renderTools();
      }
    });
  }

  render() {
    let MenuButtonClass = 'menu-button fa fa-bars';
    let navClass = 'menuNav';

    if (this.state.showmenu) {
      MenuButtonClass = 'menu-button fa fa-close';
      navClass += ' is-active';
    }

    return (
      <div id="app">
        <Notifications />
        <div className="content">
          <nav>
            <h1><SiteName/></h1>
          </nav>
          <header>
            <i className={MenuButtonClass} onClick={this.toggleMenu.bind(this)}></i>
            <h1 className="logotype"><SiteName/></h1>
            {this.renderTools()}
            <Menu location={this.props.location} onClick={this.toggleMenu.bind(this)} className={navClass} />
          </header>
          <div className="app-content container-fluid">
            <Confirm {...this.state.confirmOptions}/>
            {this.props.children}
            <GoogleAnalytics/>
          </div>
        </div>
      </div>
    );
  }
}

App.propTypes = {
  fetch: PropTypes.func,
  children: PropTypes.object,
  location: PropTypes.object
};

App.childContextTypes = {
  confirm: PropTypes.func,
  locale: PropTypes.string
};

App.contextTypes = {
  getUser: PropTypes.func,
  router: PropTypes.object
};

export default App;
