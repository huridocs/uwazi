import React, { Component, PropTypes } from 'react'
import {events} from '../../utils/index'
import template from './templates/login.js'
import api from '../../utils/singleton_api'
import { Router } from 'react-router'


class Login extends Component {

  constructor(props, context) {
    super(props, context);
    this.state = {error: false};
    this.state.credentials = {username:'', password:''}
  }

  render = () => {
    this.render = template.bind(this);
    return this.render();
  };

  user_change = (e) => {
    this.state.credentials.username = e.target.value;
    this.setState(this.state);
  };

  password_change = (e) => {
    this.state.credentials.password = e.target.value;
    this.setState(this.state);
  };

  submit = (e) => {
    e.preventDefault();

    return api.post('login', this.state.credentials)
    .then((response) => {
      this.setState({error: false})
      events.emit('login');
      this.props.history.pushState('/');
    })
    .catch(() => {
      this.setState({error: true})
    });
  };
}

export default Login;
