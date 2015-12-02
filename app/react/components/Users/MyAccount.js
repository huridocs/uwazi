import React, { Component, PropTypes } from 'react'
import template from './templates/my_account.js'
import fetch from 'isomorphic-fetch'

class MyAccount extends Component {

  constructor(props) {
    super(props);
    this.state = {feedback: {}};
    this.fetch = props.fetch || fetch;
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
    e.preventDefault();

    if(this.state.password !== this.state.repeat_password) {
      this.setState({feedback: {message: 'Passwords should match', type: 'warning'}})
      return;
    }

    let user = this.props.user;
    user.password = this.state.password;
    return this.fetch('/api/users', {method:'POST',
                 headers: {
                   'Accept': 'application/json',
                   'Content-Type': 'application/json'
                 },
                 credentials: 'same-origin',
                 body: JSON.stringify(user)})
      .then((response) => {
        this.setState({feedback: {message: 'Password changed succesfully', type: 'success'}})
      }
    );
  }
}

export default MyAccount;
