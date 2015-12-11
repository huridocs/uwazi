import React, { Component, PropTypes } from 'react'
import {events} from '../../utils/index'
import template from './templates/login.js'
import api from '../../utils/api'

class Login extends Component {

  constructor(props) {
    super(props);
    this.state = {error: false};
    this.state.credentials = {username:'', password:''}
  }

  render = () => {
    this.render = template.bind(this);
    return this.render();
  }

  user_change = (e) => {
    this.state.credentials.username = e.target.value;
    this.setState(this.state);
  }

  password_change = (e) => {
    this.state.credentials.password = e.target.value;
    this.setState(this.state);
  }

  submit = (e) => {
    e.preventDefault();

    return api.post('login', this.state.credentials)
      .then((response) => {
        this.setState({error: response.status !== 200})
        events.emit('login');
      }
    );
  }
}

export default Login;
