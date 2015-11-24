import React, { Component, PropTypes } from 'react'
import {events} from '../utils/index'
import template from './templates/login.js'

class Login extends Component {

  constructor(props) {
    super(props);
    this.state = {username:'', password:'', succeed: true};
  }

  render = () => {
    this.render = template.bind(this);
    return this.render();
  }

  user_change = (e) => {
    this.setState({username:e.target.value});
  }

  password_change = (e) => {
    this.setState({password:e.target.value});
  }

  handle_submit = (e) => {
    e.preventDefault();

    return fetch('/api/login', {method:'POST',
                 headers: {
                   'Accept': 'application/json',
                   'Content-Type': 'application/json'
                 },
                 credentials: 'same-origin',
                 body: JSON.stringify(this.state)})
      .then((response) => {
        this.setState({succeed: response.status === 200})
        events.emit('login');
      }
    );
  }
}

export default Login;
