import React from 'react';

import RouteHandler from 'app/App/RouteHandler';
import { actions } from 'app/BasicReducer';
import { UserManagement } from 'app/Users/UserManagement';
import UsersAPI from './UsersAPI';

export class OldUsers extends RouteHandler {
  static async requestState(requestParams) {
    const users = await UsersAPI.get(requestParams);
    return [actions.set('users', users)];
  }

  render() {
    return <UserManagement />;
  }
}

export default OldUsers;
