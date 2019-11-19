/** @format */

import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { I18NLink } from 'app/I18N';
import { bindActionCreators } from 'redux';
import { List } from 'immutable';

import { deleteUser as deleteUserAction } from 'app/Users/actions/actions';
import { t } from 'app/I18N';
import { Icon } from 'UI';

export class UsersList extends Component {
  deleteUser(user) {
    return this.context.confirm({
      accept: () => {
        this.props.deleteUser({ _id: user.get('_id'), sharedId: user.get('sharedId') });
      },
      title: `Confirm delete user: ${user.get('username')}`,
      message: 'Are you sure you want to delete this user?',
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
                &nbsp;&nbsp;&nbsp;
                <span className={`btn-color btn-color-${user.get('using2fa') ? '9' : '1'}`}>
                  <Icon icon={user.get('using2fa') ? 'check' : 'times'} /> 2fa
                </span>
              </div>
              <div className="list-group-item-actions">
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
                <span className="btn-color btn-color-9">
                  <Icon icon="check" /> 2fa
                </span>
                &nbsp;&nbsp;&nbsp;
                <span>Reflects the user is using two-step (two-factor) authentication login.</span>
              </p>
              <p>
                <span className="btn-color btn-color-1">
                  <Icon icon="times" /> 2fa
                </span>
                &nbsp;&nbsp;&nbsp;
                <span>
                  Reflects the user has not yet configured two-step (two-factor) authentication.
                </span>
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
};

UsersList.contextTypes = {
  confirm: PropTypes.func,
};

export function mapStateToProps({ users }) {
  return { users };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ deleteUser: deleteUserAction }, dispatch);
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(UsersList);
