import React from 'react';

import RouteHandler from 'app/App/RouteHandler';
import { actions } from 'app/BasicReducer';
import UsersAPI from './UsersAPI';

import UsersList from './components/UsersList';

export class Users extends RouteHandler {
  static async requestState(requestParams) {
    const users = await UsersAPI.get(requestParams);
    return [actions.set('users', users)];
  }

  render() {
    return <UsersList />;
  }
}

export default Users;
