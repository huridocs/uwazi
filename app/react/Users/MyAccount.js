import React, {PropTypes, Component} from 'react';
import fetch from 'isomorphic-fetch';
import Helmet from 'react-helmet';
import Alert from 'app/components/Elements/Alert';
import {connect} from 'react-redux';

export class MyAccount extends Component {

  constructor(props, context) {
    super(props, context);
    this.state = {feedback: {}};
    this.fetch = props.fetch || fetch;
  }

  render() {
    return (
      <div className="row">
        <Helmet title="My account" />
        <h1>{this.props.user.username}</h1>
        <hr/>
        <h2>Update password</h2>
        <div className="col-xs-4">
          <Alert message={this.state.feedback.message} type={this.state.feedback.type} />
          <form onSubmit={this.submit.bind(this)}>
            <div className="form-group">
              <label htmlFor="password">New password</label>
              <input type="password" className="form-control" name="password" id="password"
                onChange={this.passwordChange.bind(this)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="repeatPassword">Repeat password</label>
              <input type="password" className="form-control" name="repeatPassword" id="repeatPassword"
                onChange={this.repeatPasswordChange.bind(this)}
              />
            </div>
            <button type="submit" className="btn btn-default btn-primary">Change</button>
          </form>
        </div>
      </div>
    );
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

export function mapStateToProps({user}) {
  return {user};
}

export default connect(mapStateToProps)(MyAccount);
