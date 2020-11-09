import React from 'react';

import RouteHandler from 'app/App/RouteHandler';
import { actions } from 'app/BasicReducer';
import { TabContent, Tabs } from 'react-tabs-redux';
import UserGroups from 'app/Users/components/usergroups/UserGroups';
import UsersAPI from './UsersAPI';

import UsersList from './components/UsersList';

export class Users extends RouteHandler {
  static async requestState(requestParams) {
    const users = await UsersAPI.get(requestParams);
    return [actions.set('users', users)];
  }

  render() {
    const selectedTab = 'users';
    return (
      <Tabs selectedTab={selectedTab}>
        <TabContent for="users">
          <UsersList />
        </TabContent>
        <TabContent for="usergroups">
          <UserGroups />
        </TabContent>
      </Tabs>
    );
  }
}

export default Users;
