import React, { Component, PropTypes } from 'react'
import Helmet from 'react-helmet'
import {events} from '../utils/index'

class Login extends Component {

  constructor(props) {
    super(props);
    this.state = {username:'', password:'', succeed: true};
  }

  render() {
    return (
      <div>
        <Helmet title="Login" />
        <h1>Login</h1>
        <p>
        {(() => {
          if(!this.state.succeed){
            return 'invalid password or username'
          }
        })()}
        </p>
        <form method="post" onSubmit={ this.handle_submit }>
          <label>username</label>
          <input type="text" name="username" value={ this.state.username } onChange={ this.user_change }/>
          <label>password</label>
          <input type="password" name="password" value={ this.state.password } onChange={ this.password_change }/>
          <button type="submit">Login</button>
        </form>
      </div>
    )
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
