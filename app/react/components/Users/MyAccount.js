import React, { Component, PropTypes } from 'react'
import {events} from '../../utils/index'
import template from './templates/my_account.js'
import fetch from 'isomorphic-fetch'

class MyAccount extends Component {

  constructor(props) {
    super(props);
    this.state = {error: false};
    this.fetch = props.fetch || fetch;
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
      this.setState({username: response.username})
    })
  }

  render = () => {
    this.render = template.bind(this);
    return this.render();
  }

  password_change = (e) => {
    this.setState({password: e.target.value});
  }

  repeat_password_change = (e) => {
    this.setState({repeat_password: e.target.value});
  }

  submit = (e) => {
    this.setState({error: this.state.password !== this.state.repeat_password})
    // e.preventDefault();
    //
    // return this.fetch('/api/login', {method:'POST',
    //              headers: {
    //                'Accept': 'application/json',
    //                'Content-Type': 'application/json'
    //              },
    //              credentials: 'same-origin',
    //              body: JSON.stringify(this.state.credentials)})
    //   .then((response) => {
    //     this.setState({error: response.status !== 200})
    //     events.emit('login');
    //   }
    // );
  }
}

export default MyAccount;
