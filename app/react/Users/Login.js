import React from 'react';
import {PropTypes} from 'react';
import {browserHistory} from 'react-router';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {Field, Form} from 'react-redux-form';
import RouteHandler from 'app/App/RouteHandler';
import Footer from 'app/App/Footer';

import auth from 'app/Auth';

export class Login extends RouteHandler {

  constructor(props, context) {
    super(props, context);
    this.state = {error: false, recoverPassword: false};
  }

  submit(credentials) {
    if (this.state.recoverPassword) {
      return this.recoverPassword(credentials.username);
    }

    return this.login(credentials);
  }

  recoverPassword(email) {
    return this.props.recoverPassword(email);
  }

  login(credentials) {
    return this.props.login(credentials)
    .then(() => {
      browserHistory.push('/');
    })
    .catch(() => {
      this.setState({error: true});
    });
  }

  setRecoverPassword() {
    this.setState({recoverPassword: true, error: false});
  }

  render() {
    return <div className="content login-content">
      <div className="row">
        <div className="col-xs-12 col-sm-4 col-sm-offset-4">
          <h1>uwazi</h1>
          <Form onSubmit={this.submit.bind(this)} model="users.form">
            <div className={'form-group login-email' + (this.state.error ? ' has-error' : '')}>
              <Field model="users.form.username">
                <label htmlFor="username">{this.state.recoverPassword ? 'EMAIL' : 'LOGIN'}</label>
                <input type="text" name="username" id="username" className="form-control"/>
              </Field>
            </div>
            <div className={'form-group login-password ' + (this.state.error ? 'has-error' : '') + (this.state.recoverPassword ? ' is-hidden' : '')}>
              <label htmlFor="password">Password</label>
              <div className="input-group">
                <Field model="users.form.password">
                  <input type="password" name="password" id="password" className="form-control"/>
                </Field>
                  <div className="input-group-btn">
                    <div title="Don't remember your password?"
                      onClick={this.setRecoverPassword.bind(this)} className={'btn' + (this.state.error ? ' btn-danger' : ' btn-default')}
                    >
                      <i className="fa fa-question"></i>
                    </div>
                  </div>
              </div>
              <div className="required">Login failed</div>
            </div>
            <button type="submit" className={'btn btn-block btn-lg ' + (this.state.recoverPassword ? 'btn-success' : 'btn-primary')}>
              {this.state.recoverPassword ? 'Send recovery email' : 'Login'}
            </button>
          </Form>
        </div>
      </div>
      <Footer/>
    </div>;
  }
}

Login.propTypes = {
  login: PropTypes.func,
  recoverPassword: PropTypes.func
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({login: auth.actions.login, recoverPassword: auth.actions.recoverPassword}, dispatch);
}

export default connect(null, mapDispatchToProps)(Login);
