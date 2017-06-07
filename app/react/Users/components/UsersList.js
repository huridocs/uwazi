import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {I18NLink} from 'app/I18N';
import {bindActionCreators} from 'redux';

import {deleteUser} from 'app/Users/actions/actions';
import {t} from 'app/I18N';


export class UsersList extends Component {

  deleteUser(user) {
    return this.context.confirm({
      accept: () => {
        this.props.deleteUser({_id: user.get('_id'), sharedId: user.get('sharedId')});
      },
      title: 'Confirm delete user: ' + user.get('username'),
      message: 'Are you sure you want to delete this user?'
    });
  }

  render() {
    const {users} = this.props;

    return (
      <div className="panel panel-default">
        <div className="panel-heading">{t('System', 'Users')}</div>
        <ul className="list-group users">
          {users.map((user, index) =>
            <li key={index} className="list-group-item">
              <span>{user.get('username')}</span>
              <div className="list-group-item-actions">
                <I18NLink to={'/settings/users/edit/' + user.get('_id')} className="btn btn-default btn-xs">
                  <i className="fa fa-pencil"></i>&nbsp;
                  <span>{t('System', 'Edit')}</span>
                </I18NLink>
                <a onClick={this.deleteUser.bind(this, user)} className="btn btn-danger btn-xs template-remove">
                  <i className="fa fa-trash"></i>&nbsp;
                  <span>{t('System', 'Delete')}</span>
                </a>
              </div>
            </li>
          )}
        </ul>
        <div className="settings-footer">
          <I18NLink to="/settings/users/new" className="btn btn-success">
            <i className="fa fa-plus"></i>
            <span className="btn-label">{t('System', 'Add user')}</span>
          </I18NLink>
        </div>
      </div>
    );
  }
}

UsersList.propTypes = {
  users: PropTypes.object,
  deleteUser: PropTypes.func
};

UsersList.contextTypes = {
  confirm: PropTypes.func
};

export function mapStateToProps({users}) {
  return {users};
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({deleteUser}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(UsersList);
