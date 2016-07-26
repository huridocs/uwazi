import fetch from 'isomorphic-fetch';
import React, {Component, PropTypes} from 'react';

import 'bootstrap/dist/css/bootstrap.css';
import 'font-awesome/css/font-awesome.css';
import './scss/styles.scss';
import './scss/fixes.scss';

import Helmet from 'react-helmet';
import Notifications from 'app/Notifications';
import Menu from './Menu';
import SiteName from './SiteName';
import Confirm from './Confirm';

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
    let menuClass = 'col-md-5 col-sm-6';
    let menuToggleClass = 'navbar-toggle ';
    let MenuButtonClass = 'menu-button fa fa-bars';
    let navClass = 'nav nav-pills col-sm-6 col-md-5';

    if (this.state.showmenu) {
      menuClass += ' in';
      menuToggleClass += 'active';
      MenuButtonClass = 'menu-button fa fa-close';
      navClass += ' is-active';
    }

    return (
      <div id="app">
        <Helmet
          titleTemplate='Uwazi - %s'
          meta={[
            {'char-set': 'utf-8'},
            {name: 'description', content: 'Uwazi docs'}
          ]}
        />
        <Notifications />
        <div className="content">
          <nav>
            <h1><SiteName/></h1>
          </nav>
          <header>
            <div className="container-fluid">
              <div className="row">
                <h1 className="col-sm-2"><SiteName/></h1>
                <div className="col-sm-4 col-md-5">
                  <i className={MenuButtonClass} onClick={this.toggleMenu.bind(this)}></i>
                  {this.renderTools()}
                </div>
                <Menu onClick={this.toggleMenu.bind(this)} className={navClass} />
              </div>
            </div>
          </header>
          <div className="app-content container-fluid">
            <Confirm {...this.state.confirmOptions}/>
            {this.props.children}
          </div>
        </div>
      </div>
    );
  }
}

App.propTypes = {
  fetch: PropTypes.func,
  children: PropTypes.object
};

App.childContextTypes = {
  confirm: PropTypes.func
};

App.contextTypes = {
  getUser: PropTypes.func,
  router: PropTypes.object
};

export default App;
