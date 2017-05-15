import React from 'react';

import RouteHandler from 'app/App/RouteHandler';
import UsersAPI from './UsersAPI';
import {actions} from 'app/BasicReducer';

import UsersList from './components/UsersList';

export class Users extends RouteHandler {

  static requestState() {
    return UsersAPI.list()
    .then((users) => {
      return {users};
    });
  }

  setReduxState(state) {
    this.context.store.dispatch(actions.set('users', state.users));
  }

  render() {
    return <UsersList />;
  }
}

export default Users;
