import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { actions } from 'app/BasicReducer';
import UsersAPI from 'app/Users/UsersAPI';
import { notify as notifyAction } from 'app/Notifications/actions/notificationsActions';
import { RequestParams } from 'app/utils/RequestParams';
import { t, I18NLink, Translate } from 'app/I18N';
import { Icon } from 'UI';
import { createSelector } from 'reselect';
import { Pill } from 'app/Metadata/components/Pill';
import { SettingsHeader } from './SettingsHeader';

const roleTranslationKey = {
  admin: 'Admin',
  editor: 'Editor',
  collaborator: 'Collaborator',
};

class AccountSettings extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      email: props.user.email || '',
      password: '',
      repeatPassword: '',
      using2fa: props.user.using2fa,
    };
    this.passwordChange = this.passwordChange.bind(this);
    this.repeatPasswordChange = this.repeatPasswordChange.bind(this);
    this.updatePassword = this.updatePassword.bind(this);
    this.updateEmail = this.updateEmail.bind(this);
    this.emailChange = this.emailChange.bind(this);
  }

  passwordChange(e) {
    this.setState({ password: e.target.value });
    this.setState({ passwordError: false });
  }

  repeatPasswordChange(e) {
    this.setState({ repeatPassword: e.target.value });
    this.setState({ passwordError: false });
  }

  updateEmail(e) {
    const { email } = this.state;
    const { user, notify, setUser } = this.props;

    e.preventDefault();
    const userData = { ...user, email };
    UsersAPI.save(new RequestParams(userData)).then(result => {
      notify(t('System', 'Email updated', null, false), 'success');
      setUser(Object.assign(userData, { _rev: result.rev }));
    });
  }

  updatePassword(e) {
    e.preventDefault();

    const { password, repeatPassword } = this.state;
    const { user, notify, setUser } = this.props;

    const passwordsDontMatch = password !== repeatPassword;
    const emptyPassword = password.trim() === '';
    if (emptyPassword || passwordsDontMatch) {
      this.setState({ passwordError: true });
      return;
    }

    UsersAPI.save(new RequestParams({ ...user, password })).then(result => {
      notify(t('System', 'Password updated', null, false), 'success');
      setUser(Object.assign(user, { _rev: result.rev }));
    });
    this.setState({ password: '', repeatPassword: '' });
  }

  emailChange(e) {
    this.setState({ email: e.target.value });
  }

  renderPasswordField(id, value, label, passwordError) {
    return (
      <div className={`form-group ${passwordError ? 'has-error' : ''}`}>
        <label className="form-group-label" htmlFor={id}>
          <Translate>{label}</Translate>
        </label>
        <input
          type="password"
          onChange={this[`${id}Change`]}
          value={value}
          id={id}
          className="form-control"
        />
      </div>
    );
  }

  render() {
    const { email, password, repeatPassword, passwordError, using2fa } = this.state;
    const { username, groups = [], role } = this.props.user;
    return (
      <div className="settings-content">
        <div className="account-settings">
          <div className="panel panel-default">
            <SettingsHeader>
              <Translate>Account</Translate>
            </SettingsHeader>
            <div className="panel-body">
              <div className="user-details">
                <div>
                  <Translate>Username</Translate>:&nbsp;&nbsp;
                  <strong>{username}</strong>
                </div>
                <div className="user-details-role">
                  <Translate>Role</Translate>:&nbsp;&nbsp;
                  <Pill>
                    <Translate translationKey={roleTranslationKey[role]}>{role}</Translate>
                  </Pill>
                </div>
                {groups.length > 0 && (
                  <div>
                    <Translate>Groups</Translate>:&nbsp;&nbsp;
                    {groups.map(g => (
                      <Pill key={g._id?.toString()}>{g.name}</Pill>
                    ))}
                  </div>
                )}
              </div>
              <hr />
              <h5>
                <Translate>Email address</Translate>
              </h5>
              <form onSubmit={this.updateEmail}>
                <div className="form-group">
                  <label className="form-group-label" htmlFor="collection_name">
                    <Translate>Email</Translate>
                  </label>
                  <input
                    type="email"
                    onChange={this.emailChange}
                    value={email}
                    className="form-control"
                  />
                </div>
                <button type="submit" className="btn btn-success">
                  <Translate>Update</Translate>
                </button>
              </form>
              <hr />
              <h5>
                <Translate>Change password</Translate>
              </h5>
              <form onSubmit={this.updatePassword}>
                {this.renderPasswordField('password', password, 'New password', passwordError)}
                {this.renderPasswordField(
                  'repeatPassword',
                  repeatPassword,
                  'Confirm new password',
                  passwordError
                )}
                {passwordError && (
                  <div className="validation-error validation-error-centered">
                    <Icon icon="exclamation-triangle" />
                    &nbsp;
                    <Translate>Password Error</Translate>
                  </div>
                )}
                <button type="submit" className="btn btn-success">
                  <Translate>Update</Translate>
                </button>
              </form>
              <hr />
              <h5>
                <Translate>Two-step verification</Translate>
              </h5>
              {using2fa && (
                <div className="alert alert-info">
                  <Icon icon="check" size="2x" />
                  <div className="force-ltr">
                    <Translate>Your account is protected by 2fa.</Translate>
                  </div>
                </div>
              )}
              {!using2fa && (
                <div>
                  <div className="alert alert-warning">
                    <Icon icon="exclamation-triangle" size="2x" />
                    <div className="force-ltr">
                      <Translate>
                        You should activate this feature for enhanced account security
                      </Translate>
                    </div>
                  </div>
                  <div>
                    <I18NLink to="/settings/2fa" className="btn btn-success">
                      <Translate>Protect your account</Translate>
                    </I18NLink>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="settings-footer">
            <a href="/logout" className="btn btn-danger">
              <Icon icon="power-off" />
              <span className="btn-label">
                <Translate>Logout</Translate>
              </span>
            </a>
          </div>
        </div>
      </div>
    );
  }
}

AccountSettings.defaultProps = {
  user: {},
};

AccountSettings.propTypes = {
  user: PropTypes.instanceOf(Object),
  notify: PropTypes.func.isRequired,
  setUser: PropTypes.func.isRequired,
};

const selectUser = createSelector(
  state => state.user,
  user => user.toJS()
);

function mapStateToProps(state) {
  return { user: selectUser(state) };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    { setUser: actions.set.bind(null, 'auth/user'), notify: notifyAction },
    dispatch
  );
}

export { AccountSettings, mapStateToProps, createSelector };
export default connect(mapStateToProps, mapDispatchToProps)(AccountSettings);
