import fetch from 'isomorphic-fetch'
import React, { Component, PropTypes } from 'react'
import { Router, match, RoutingContext, RouteContext } from 'react-router'

import {events} from '../../utils/index'

import Helmet from 'react-helmet'
import UserWidget from '../Users/UserWidget'
import { Link } from 'react-router'
import 'bootstrap/dist/css/bootstrap.css'
import './scss/App.scss'
import 'font-awesome/css/font-awesome.css'
import Menu from './Menu.js'

class App extends Component {

  static contextTypes = {getUser: PropTypes.func };

  constructor(props, context) {
    super(props);
    this.fetch = props.fetch || fetch;
    this.state = {user: context.getUser(), showsidebar: false};
    events.on('login', this.fetchUser);
  }

  fetchUser = () => {
    return this.fetch('/api/user', {method:'GET',
                 headers: {
                   'Accept': 'application/json',
                   'Content-Type': 'application/json'
                 },
                 credentials: 'same-origin'})
    .then((response) => response.json())
    .then((response) => {
      this.setState({user: response})
    })
  };

  renderChildren = () => {
    return React.Children.map(this.props.children, (child, index) => {
      return React.cloneElement(child, {user: this.state.user});
    });
  };

  toggleSidebar = () => {
    this.setState({showsidebar: !this.state.showsidebar});
  };

  render = () => {

    let sidebarClass = 'sidebar sidebar-show';

    if(!this.state.showsidebar) {
      sidebarClass = 'sidebar sidebar-hidden';
    }

    return (
      <div>
        <Helmet
          titleTemplate='Uwazi - %s'
          meta={[
            {'char-set': 'utf-8'},
            {'name': 'description', 'content': 'Uwazi docs'}
          ]}
        />

        <nav className="nav navbar-nav navbar-default navbar-fixed-top">
          <div className="navbar-header">
            <Link to='/' className="navbar-brand">UwaziDocs</Link>
          </div>
          <div className="container-fluid">
           <div id="navbar" className="">
            <UserWidget user={ this.state.user } />
            <ul className="nav navbar-nav navbar-right">
              <li><a className="toggleidebar" href="#" onClick={this.toggleSidebar}><i className="fa fa-bars"></i></a></li>
            </ul>
           </div>
       </div>
     </nav>
        <div className='container-fluid contents-wrapper'>
          <div className="row">
            <div className={sidebarClass}>
              <Menu className="nav nav-sidebar"/>
            </div>
            <div className="contents">
              {this.renderChildren()}
            </div>
          </div>
        </div>
      </div>
    )
  };
}

export default App;
