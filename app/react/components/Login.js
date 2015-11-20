import React, { Component, PropTypes } from 'react'
import Helmet from 'react-helmet'

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

    var _this = this;

    return fetch('/api/login', {method:'POST',
                 headers: {
                   'Accept': 'application/json',
                   'Content-Type': 'application/json'
                 },
                 body: JSON.stringify(this.state)})
    .then(function(response) {
      response.json()
      .then(function(response) {
        _this.setState({succeed:response.success})
      });
    });
  }
}

export default Login;
