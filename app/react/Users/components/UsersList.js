/** @format */

import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { List } from 'immutable';

import { deleteUser as deleteUserAction } from 'app/Users/actions/actions';
import { reset2fa as reset2faAction } from 'app/Auth2fa/actions/actions';
import { t, I18NLink } from 'app/I18N';
import { Icon } from 'UI';

export class UsersList extends Component {
  deleteUser(user) {
    const { confirm } = this.context;
    const { deleteUser } = this.props;
    return confirm({
      accept: () => {
        deleteUser({ _id: user.get('_id'), sharedId: user.get('sharedId') });
      },
      title: `Confirm delete user: ${user.get('username')}`,
      message: 'Are you sure you want to delete this user?',
    });
  }

  reset2fa(user) {
    const { confirm } = this.context;
    const { reset2fa } = this.props;
    return confirm({
      accept: () => {
        reset2fa(user.toJS());
      },
      title: `Confirm resetting 2fa for user: ${user.get('username')}`,
      message:
        'Are you sure you want to reset two-step authentication for this user? ' +
        'The account will be less secure and the user will need to reconfigure his credentials.',
    });
  }

  render() {
    const { users } = this.props;
    return (
      <div className="panel panel-default">
        <div className="panel-heading">{t('System', 'Users')}</div>
        <ul className="list-group users">
          {users.map(user => (
            <li key={user.get('_id')} className="list-group-item">
              <div>
                <span>{user.get('username')}</span>
                {user.get('using2fa') && (
                  <>
                    &nbsp;&nbsp;&nbsp;
                    <span className="btn-xs btn-color btn-color-9">
                      <Icon icon="check" /> 2fa
                    </span>
                  </>
                )}
              </div>
              <div className="list-group-item-actions">
                {user.get('using2fa') && (
                  <button
                    type="button"
                    onClick={this.reset2fa.bind(this, user)}
                    className="btn btn-color btn-color-8 btn-xs"
                  >
                    <span>{t('System', 'Reset 2fa')}</span>
                  </button>
                )}
                <I18NLink
                  to={`/settings/users/edit/${user.get('_id')}`}
                  className="btn btn-default btn-xs"
                >
                  <Icon icon="pencil-alt" />
                  &nbsp;
                  <span>{t('System', 'Edit')}</span>
                </I18NLink>
                <button
                  type="button"
                  onClick={this.deleteUser.bind(this, user)}
                  className="btn btn-danger btn-xs template-remove"
                >
                  <Icon icon="trash-alt" />
                  &nbsp;
                  <span>{t('System', 'Delete')}</span>
                </button>
              </div>
            </li>
          ))}
          <li className="list-group-item">
            <div>
              <h5>{t('System', 'Legend')}</h5>
              <p>
                <span className="btn-xs btn-color btn-color-9">
                  <Icon icon="check" /> 2fa
                </span>
                &nbsp;&nbsp;&nbsp;
                <span>The user is using two-step (two-factor) authentication login.</span>
              </p>
            </div>
          </li>
        </ul>
        <div className="settings-footer">
          <I18NLink to="/settings/users/new" className="btn btn-success">
            <Icon icon="plus" />
            <span className="btn-label">{t('System', 'Add user')}</span>
          </I18NLink>
        </div>
      </div>
    );
  }
}

UsersList.defaultProps = {
  users: List(),
};

UsersList.propTypes = {
  users: PropTypes.instanceOf(List),
  deleteUser: PropTypes.func.isRequired,
  reset2fa: PropTypes.func.isRequired,
};

UsersList.contextTypes = {
  confirm: PropTypes.func,
};

export function mapStateToProps({ users }) {
  return { users };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ deleteUser: deleteUserAction, reset2fa: reset2faAction }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(UsersList);
