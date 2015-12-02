import React, { Component, PropTypes } from 'react'
import {events} from '../../utils/index'
import template from './templates/login.js'
import fetch from 'isomorphic-fetch'

class Login extends Component {

  constructor(props) {
    super(props);
    this.state = {error: false};
    this.state.credentials = {username:'', password:''}
    this.fetch = props.fetch || fetch;
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

    return this.fetch('/api/login', {method:'POST',
                 headers: {
                   'Accept': 'application/json',
                   'Content-Type': 'application/json'
                 },
                 credentials: 'same-origin',
                 body: JSON.stringify(this.state.credentials)})
      .then((response) => {
        this.setState({error: response.status !== 200})
        events.emit('login');
      }
    );
  }
}

export default Login;
