import React from 'react';

import RouteHandler from 'app/App/RouteHandler';
import { actions } from 'app/BasicReducer';
import UsersAPI from './UsersAPI';

import UsersList from './components/UsersList';

export class Users extends RouteHandler {
  static requestState() {
    return UsersAPI.list()
    .then(users => ({ users }));
  }

  setReduxState(state) {
    this.context.store.dispatch(actions.set('users', state.users));
  }

  render() {
    return <UsersList />;
  }
}

export default Users;
