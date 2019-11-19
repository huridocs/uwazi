/** @format */

import PropTypes from 'prop-types';
import React from 'react';
import { browserHistory } from 'react-router';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Field, LocalForm, actions as formActions } from 'react-redux-form';

import { t } from 'app/I18N';
import { reconnectSocket } from 'app/socket';
import RouteHandler from 'app/App/RouteHandler';
import ShowIf from 'app/App/ShowIf';
import { reloadThesauris } from 'app/Thesauris/actions/thesaurisActions';

import auth from 'app/Auth';

const reloadHome = () => {
  window.location.reload();
};

export class Login extends RouteHandler {
  constructor(props, context) {
    super(props, context);
    this.state = { error: false, recoverPassword: false, tokenRequired: false };
    this.submit = this.submit.bind(this);
    this.setLogin = this.setLogin.bind(this);
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
      browserHistory.push('/');
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
      // TEST for err 409
      if (!this.state.tokenRequired && err.status === 409) {
        this.setState({ tokenRequired: true });
      } else {
        // TEST for reseting token
        this.formDispatch(formActions.change('loginForm.token', undefined));
        this.setState({ error: true });
        this.setState({ tokenRequired: false });
      }
    }
  }

  setRecoverPassword() {
    this.formDispatch(formActions.reset('loginForm'));
    this.setState({ recoverPassword: true, error: false });
  }

  setLogin() {
    this.formDispatch(formActions.reset('loginForm'));
    this.setState({ recoverPassword: false, error: false });
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
          <div className="col-xs-12 col-sm-4 col-sm-offset-4">
            <h1 className="login-title">
              <img src="/public/logo.svg" title="uwazi" alt="uwazi" />
            </h1>
            <LocalForm
              onSubmit={this.submit}
              model="loginForm"
              getDispatch={dispatch => {
                this.formDispatch = dispatch;
              }}
            >
              {!this.state.tokenRequired && (
                <React.Fragment>
                  <div className={`form-group login-email${this.state.error ? ' has-error' : ''}`}>
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
                        onClick={this.setRecoverPassword.bind(this)}
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
                <div className="form-group login-token">
                  <h5>{t('System', 'Two-step verification')}</h5>
                  <Field model=".token">
                    <label className="form-group-label" htmlFor="token">
                      {t('System', 'Authentication code')}
                    </label>
                    <input type="text" name="token" id="token" className="form-control" />
                    <div className="form-text">
                      <p>
                        Open the two-factor Authenticator app on your device <br />
                        to view your authentication code and verify your identity.
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
              <ShowIf if={this.state.recoverPassword}>
                <div className="form-text">
                  <span
                    title={t('System', 'Cancel', null, false)}
                    onClick={this.setLogin}
                    className="button cancel"
                  >
                    {t('System', 'Cancel')}
                  </span>
                </div>
              </ShowIf>
            </LocalForm>
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
      reloadThesauris,
    },
    dispatch
  );
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Login);
