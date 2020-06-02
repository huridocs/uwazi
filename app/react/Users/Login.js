import PropTypes from 'prop-types';
import React from 'react';
import { browserHistory } from 'react-router';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Field, LocalForm, actions as formActions } from 'react-redux-form';

import { Icon } from 'UI';

import { t } from 'app/I18N';
import { isClient } from 'app/utils';
import { reconnectSocket } from 'app/socket';
import RouteHandler from 'app/App/RouteHandler';
import { reloadThesauri } from 'app/Thesauri/actions/thesaurisActions';

import auth from 'app/Auth';

const reloadHome = () => {
  window.location.assign('/');
};

export class Login extends RouteHandler {
  constructor(props, context) {
    super(props, context);
    this.state = { error: false, error2fa: false, recoverPassword: false, tokenRequired: false };
    this.submit = this.submit.bind(this);
    this.setLogin = this.setLogin.bind(this);
    this.setRecoverPassword = this.setRecoverPassword.bind(this);
  }

  attachDispatch(dispatch) {
    this.formDispatch = dispatch;
  }

  submit(credentials) {
    if (this.state.recoverPassword) {
      return this.recoverPassword(credentials.username);
    }

    return this.login(credentials);
  }

  recoverPassword(email) {
    this.setState({ recoverPassword: false, error: false });
    this.formDispatch(formActions.reset('loginForm'));
    return this.props.recoverPassword(email);
  }

  resolveSuccessfulLogin() {
    if (this.props.private) {
      reloadHome();
      return;
    }
    reconnectSocket();
    this.props.reloadThesauris();
    browserHistory.push('/');
  }

  async login(credentials) {
    try {
      await this.props.login(credentials);
      this.resolveSuccessfulLogin();
    } catch (err) {
      if (!this.state.tokenRequired && err.status === 409) {
        this.setState({ tokenRequired: true });
      } else {
        const { tokenRequired } = this.state;
        this.formDispatch(formActions.change('loginForm.token', undefined));
        const error2fa = tokenRequired;
        this.setState({ error: true, tokenRequired, error2fa });
      }
    }
  }

  setRecoverPassword() {
    this.formDispatch(formActions.reset('loginForm'));
    this.setState({ recoverPassword: true, error: false });
  }

  setLogin() {
    this.formDispatch(formActions.reset('loginForm'));
    this.setState({ recoverPassword: false, tokenRequired: false, error: false, error2fa: false });
  }

  render() {
    let submitLabel = this.state.recoverPassword
      ? t('System', 'Send recovery email')
      : t('System', 'Login button', 'Login');

    if (this.state.tokenRequired) {
      submitLabel = t('System', 'Verify');
    }

    return (
      <div className="content login-content">
        <div className="row">
          <div className="col-xs-12 col-sm-4 col-sm-offset-4" suppressHydrationWarning>
            <h1 className="login-title">
              <img src="/public/logo.svg" title="uwazi" alt="uwazi" />
            </h1>
            {isClient && (
              <LocalForm
                onSubmit={this.submit}
                model="loginForm"
                getDispatch={dispatch => {
                  this.formDispatch = dispatch;
                }}
              >
                {!this.state.tokenRequired && (
                  <React.Fragment>
                    <div
                      className={`form-group login-email${this.state.error ? ' has-error' : ''}`}
                    >
                      <Field model=".username">
                        <label className="form-group-label" htmlFor="username">
                          {this.state.recoverPassword ? t('System', 'Email') : t('System', 'User')}
                        </label>
                        <input type="text" name="username" id="username" className="form-control" />
                      </Field>
                    </div>
                    <div
                      className={`form-group login-password ${this.state.error ? 'has-error' : ''}${
                        this.state.recoverPassword ? ' is-hidden' : ''
                      }`}
                    >
                      <label className="form-group-label" htmlFor="password">
                        {t('System', 'Password')}
                      </label>
                      <Field model=".password">
                        <input
                          type="password"
                          name="password"
                          id="password"
                          className="form-control"
                        />
                      </Field>
                      <div className="form-text">
                        {this.state.error && <span>{t('System', 'Login failed')} - </span>}
                        <span
                          title={t('System', 'Forgot Password?', null, false)}
                          onClick={this.setRecoverPassword}
                          className={`button forgot-password ${
                            this.state.error ? 'label-danger' : ''
                          }`}
                        >
                          {t('System', 'Forgot Password?')}
                        </span>
                      </div>
                    </div>
                  </React.Fragment>
                )}
                {this.state.tokenRequired && (
                  <div
                    className={`form-group login-token${this.state.error2fa ? ' has-error' : ''}`}
                  >
                    <h5>{t('System', 'Two-step verification')}</h5>
                    <Field model=".token">
                      <label className="form-group-label" htmlFor="token">
                        {t('System', 'Authentication code')}
                      </label>
                      <input type="text" name="token" id="token" className="form-control" />
                      <div className="form-text">
                        <p>
                          {this.state.error2fa && (
                            <React.Fragment>
                              <Icon icon="exclamation-triangle" />
                              <span>{t('System', 'Two-factor verification failed')}</span>
                            </React.Fragment>
                          )}
                        </p>
                        <p>
                          Open the two-factor Authenticator app on your device <br />
                          to view your authentication code and verify your identity.
                        </p>
                        <p>
                          <span
                            onClick={this.setLogin}
                            className={`button forgot-password ${
                              this.state.error2fa ? 'label-danger' : ''
                            }`}
                          >
                            {t('System', 'Return to login')}
                          </span>
                        </p>
                      </div>
                    </Field>
                  </div>
                )}
                <p>
                  <button
                    type="submit"
                    className={`btn btn-block btn-lg ${
                      this.state.recoverPassword ? 'btn-success' : 'btn-primary'
                    }`}
                  >
                    {submitLabel}
                  </button>
                </p>
                {this.state.recoverPassword && (
                  <div className="form-text">
                    <span
                      title={t('System', 'Cancel', null, false)}
                      onClick={this.setLogin}
                      className="button cancel"
                    >
                      {t('System', 'Cancel')}
                    </span>
                  </div>
                )}
              </LocalForm>
            )}
          </div>
        </div>
      </div>
    );
  }
}

Login.propTypes = {
  login: PropTypes.func,
  recoverPassword: PropTypes.func,
  reloadThesauris: PropTypes.func,
};

export function mapStateToProps({ settings }) {
  return {
    private: settings.collection.get('private'),
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      login: auth.actions.login,
      recoverPassword: auth.actions.recoverPassword,
      reloadThesauris: reloadThesauri,
    },
    dispatch
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(Login);
