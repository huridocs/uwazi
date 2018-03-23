import PropTypes from 'prop-types';
import React from 'react';
import {browserHistory} from 'react-router';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {Field, Form} from 'react-redux-form';
import {actions as formActions} from 'react-redux-form';

import {t} from 'app/I18N';
import {reconnectSocket} from 'app/socket';
import RouteHandler from 'app/App/RouteHandler';
import ShowIf from 'app/App/ShowIf';
import {reloadThesauris} from 'app/Thesauris/actions/thesaurisActions';

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

  static requestState() {
    return Promise.resolve({});
  }

  recoverPassword(email) {
    this.setState({recoverPassword: false, error: false});
    this.props.reset('login.form');
    return this.props.recoverPassword(email);
  }

  reloadHome() {
    window.location.reload();
  }

  login(credentials) {
    return this.props.login(credentials)
    .then(() => {
      if (this.props.private) {
        browserHistory.push('/');
        this.reloadHome();
        return;
      }
      reconnectSocket();
      this.props.reloadThesauris();
      browserHistory.push('/');
    })
    .catch(() => {
      this.setState({error: true});
    });
  }

  setRecoverPassword() {
    this.props.reset('login.form');
    this.setState({recoverPassword: true, error: false});
  }

  setLogin() {
    this.props.reset('login.form');
    this.setState({recoverPassword: false, error: false});
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
                <label className="form-group-label" htmlFor="username">
                  {this.state.recoverPassword ? t('System', 'Email') : t('System', 'User')}
                </label>
                <input type="text" name="username" id="username" className="form-control"/>
              </Field>
            </div>
            <div className={'form-group login-password ' + (this.state.error ? 'has-error' : '') + (this.state.recoverPassword ? ' is-hidden' : '')}>
              <label className="form-group-label" htmlFor="password">{t('System', 'Password')}</label>
              <Field model="login.form.password">
                <input type="password" name="password" id="password" className="form-control"/>
              </Field>
              <div className="form-text">
                <span className="required">{t('System', 'Login failed')} - </span>
                <a title={t('System', 'Forgot Password?')}
                  onClick={this.setRecoverPassword.bind(this)} className={(this.state.error ? 'label-danger' : '')}>
                  {t('System', 'Forgot Password?')}
                </a>
              </div>
            </div>
            <p>
              <button type="submit" className={'btn btn-block btn-lg ' + (this.state.recoverPassword ? 'btn-success' : 'btn-primary')}>
                {this.state.recoverPassword ? t('System', 'Send recovery email') : t('System', 'Login button', 'Login')}
              </button>
            </p>
            <ShowIf if={this.state.recoverPassword}>
              <div className="form-text">
                <a title={t('System', 'Cancel')}
                   onClick={this.setLogin.bind(this)} >
                   {t('System', 'Cancel')}
                </a>
              </div>
            </ShowIf>
          </Form>
        </div>
      </div>
    </div>;
  }
}

Login.propTypes = {
  login: PropTypes.func,
  recoverPassword: PropTypes.func,
  reloadThesauris: PropTypes.func
};

export function mapStateToProps({settings}) {
  return {
    private: settings.collection.get('private')
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    login: auth.actions.login,
    recoverPassword: auth.actions.recoverPassword,
    reset: formActions.reset,
    reloadThesauris
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Login);
