import fetch from 'isomorphic-fetch';
import React, {Component, PropTypes} from 'react';

import {events} from '../../utils/index';

import 'bootstrap/dist/css/bootstrap.css';
import 'font-awesome/css/font-awesome.css';
import './scss/layout.scss';
import './scss/alerts.scss';

import Helmet from 'react-helmet';
import Notifications from 'app/Notifications';
import Menu from './Menu.js';
import {Link} from 'react-router';

class App extends Component {

  constructor(props, context) {
    super(props, context);
    // change fetch to use api and test it properly
    this.fetch = props.fetch || fetch;
    this.state = {user: context.getUser(), showmenu: false};
    events.on('login', () => {
      this.fetchUser();
    });
  }

  fetchUser() {
    return this.fetch('/api/user', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin'
    })
    .then((response) => response.json())
    .then((response) => {
      this.setState({user: response});
    });
  }

  renderChildren() {
    return React.Children.map(this.props.children, (child) => {
      return React.cloneElement(child, {user: this.state.user});
    });
  }

  toggleMenu() {
    this.setState({showmenu: !this.state.showmenu});
  }

  closeMenu() {
    this.setState({showmenu: false});
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

    if (this.state.showmenu) {
      menuClass += ' in';
      menuToggleClass += 'active';
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
            <h1><Link to="/">Collection name</Link></h1>
            <button onClick={this.toggleMenu.bind(this)} type="button" className={menuToggleClass}><i className="fa fa-bars"/></button>
          </nav>
          <header>
            <div className="container-fluid">
              <div className="row">
                <i className="fa fa-filter"></i>
                <i className="fa fa-bars"></i>
                <h1 className="col-sm-3 col-md-3"><Link to="/">Collection name</Link></h1>
                <div className="col-sm-3 col-md-4">
                  {this.renderTools()}
                </div>
                <div onClick={this.closeMenu.bind(this)} className={menuClass}>
                  <Menu className="nav nav-pills" user={this.state.user}/>
                </div>
              </div>
            </div>
          </header>
          <div className="app-content container-fluid">
            {this.renderChildren()}
          </div>
        </div>
        <footer>
          <div className="container-fluid">
            <div className="row">
              <div className="col-sm-3">
                <h5> <i className="fa fa-heart-o"></i>What we do</h5>
                <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Doloremque eveniet labore nihil.</p>
              </div>
              <div className="col-sm-3">
                <h5> <i className="fa fa-support"></i>Help center</h5>
                <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Doloremque eveniet labore nihil.</p>
              </div>
              <div className="col-sm-3">
                <h5> <i className="fa fa-share-alt"></i>Connect with us</h5>
                <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Doloremque eveniet labore nihil.</p>
              </div>
              <div className="col-sm-3">
                <p>Powered with Uwazi.</p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
  }
}

App.propTypes = {
  fetch: PropTypes.func,
  children: PropTypes.object
};

App.contextTypes = {
  getUser: PropTypes.func,
  router: PropTypes.object
};

export default App;
