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
      <div className="row">
        <Helmet title="Login" />
        <h1>Login</h1>
        <div className="col-xs-4 col-xs-offset-4">
        {(() => {
          if(!this.state.succeed){
            return <p className="alert alert-warning">invalid password or username</p>
          }
        })()}
          <form onSubmit={ this.handle_submit }>
            <div className="form-group">
              <label for="exampleInputEmail1">Email address</label>
              <input type="text" className="form-control" name="username" value={ this.state.username } onChange={ this.user_change }/>
            </div>
            <div className="form-group">
              <label for="exampleInputPassword1">Password</label>
              <input type="password"  className="form-control" name="password" value={ this.state.password } onChange={ this.password_change }/>
            </div>
            <button type="submit" className="btn btn-default btn-primary">Submit</button>
          </form>
        </div>
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
