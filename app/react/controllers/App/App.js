import fetch from 'isomorphic-fetch'
import React, { Component, PropTypes } from 'react'
import { Router, match, RoutingContext, RouteContext } from 'react-router'

import {events} from '../../utils/index'

import Helmet from 'react-helmet'
import { Link } from 'react-router'
import 'bootstrap/dist/css/bootstrap.css'
import './scss/App.scss'
import 'font-awesome/css/font-awesome.css'
import Menu from './Menu.js'
import Alerts from './Alerts.js'

class App extends Component {

  static contextTypes = {getUser: PropTypes.func };

  constructor(props, context) {
    super(props, context);
    this.fetch = props.fetch || fetch;
    this.state = {user: context.getUser(), showmenu: false};
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


  render = () => {

    return (
      <div>
        <Helmet
          titleTemplate='Uwazi - %s'
          meta={[
            {'char-set': 'utf-8'},
            {'name': 'description', 'content': 'Uwazi docs'}
          ]}
        />
        <Alerts/>
        {this.renderChildren()}
      </div>
    )
  };
}

export default App;
