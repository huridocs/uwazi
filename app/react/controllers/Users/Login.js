import {Component} from 'react';
import {events} from '../../utils/index';
import template from './templates/login.js';
import api from '../../utils/singleton_api';
import {browserHistory} from 'react-router';
import RouteHandler from '../App/RouteHandler';


class Login extends RouteHandler {

  constructor(props, context) {
    super(props, context);
    this.state = {error: false};
    this.state.credentials = {username: '', password: ''};
  }

  userChange(e) {
    this.state.credentials.username = e.target.value;
    this.setState(this.state);
  }

  passwordChange(e) {
    this.state.credentials.password = e.target.value;
    this.setState(this.state);
  }

  submit(e) {
    e.preventDefault();

    return api.post('login', this.state.credentials)
    .then(() => {
      this.setState({error: false});
      events.emit('login');
      browserHistory.push('/');
    })
    .catch(() => {
      this.setState({error: true});
    });
  }

  render() {
    this.render = template.bind(this);
    return this.render();
  }
}

export default Login;
