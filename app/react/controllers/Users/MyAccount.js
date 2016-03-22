import {PropTypes} from 'react';
import template from './templates/my_account.js';
import fetch from 'isomorphic-fetch';
import RouteHandler from '../App/RouteHandler';

class MyAccount extends RouteHandler {

  constructor(props) {
    super(props);
    this.state = {feedback: {}};
    this.fetch = props.fetch || fetch;
  }

  render() {
    this.render = template.bind(this);
    return this.render();
  }

  passwordChange(e) {
    this.setState({password: e.target.value});
  }

  repeatPasswordChange(e) {
    this.setState({repeatPassword: e.target.value});
  }

  submit(e) {
    e.preventDefault();

    if (this.state.password !== this.state.repeatPassword) {
      this.setState({feedback: {message: 'Passwords should match', type: 'warning'}});
      return;
    }

    let user = this.props.user;
    user.password = this.state.password;
    return this.fetch('/api/users', {method: 'POST',
                 headers: {
                   Accept: 'application/json',
                   'Content-Type': 'application/json'
                 },
                 credentials: 'same-origin',
                 body: JSON.stringify(user)})
      .then(() => {
        this.setState({feedback: {message: 'Password changed succesfully', type: 'success'}});
      }
    );
  }
}

MyAccount.propTypes = {
  fetch: PropTypes.func,
  user: PropTypes.object
};

export default MyAccount;
