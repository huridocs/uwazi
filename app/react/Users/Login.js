import React from 'react';
import {PropTypes} from 'react';
import {browserHistory} from 'react-router';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {Field, Form} from 'react-redux-form';
import RouteHandler from 'app/App/RouteHandler';
import {t} from 'app/I18N';

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
          <h1 className="login-title">
            <img src="/public/logo.svg" title="uwazi" alt="uwazi"/>
          </h1>
          <Form onSubmit={this.submit.bind(this)} model="login.form">
            <div className={'form-group login-email' + (this.state.error ? ' has-error' : '')}>
              <Field model="login.form.username">
                <label htmlFor="username">{this.state.recoverPassword ? t('System', 'Email') : t('System', 'User')}</label>
                <input type="text" name="username" id="username" className="form-control"/>
              </Field>
            </div>
            <div className={'form-group login-password ' + (this.state.error ? 'has-error' : '') + (this.state.recoverPassword ? ' is-hidden' : '')}>
              <label htmlFor="password">{t('System', 'Password')}</label>
              <div className="input-group">
                <Field model="login.form.password">
                  <input type="password" name="password" id="password" className="form-control"/>
                </Field>
                  <div className="input-group-btn">
                    <div title="{t('System', 'forgotPassword', 'Don\'t remember your password?')}"
                      onClick={this.setRecoverPassword.bind(this)} className={'btn' + (this.state.error ? ' btn-danger' : ' btn-default')}
                    >
                      <i className="fa fa-question"></i>
                    </div>
                  </div>
              </div>
              <div className="required">{t('System', 'Login failed')}</div>
            </div>
            <button type="submit" className={'btn btn-block btn-lg ' + (this.state.recoverPassword ? 'btn-success' : 'btn-primary')}>
              {this.state.recoverPassword ? t('System', 'Send recovery email') : t('System', 'Login button', 'Login')}
            </button>
          </Form>
        </div>
      </div>
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
