import React, { useState } from 'react';
import { TabContent, TabLink, Tabs } from 'react-tabs-redux';
import { Translate } from 'app/I18N';
import { UserGroups } from './components/usergroups/UserGroups';
import { Users } from './components/Users';

export const UserManagement = () => {
  const [selectedTab, setSelectedTab] = useState('users');
  return (
    <div className="userManagementTabs">
      <Tabs selectedTab={selectedTab} renderActiveTabContentOnly handleSelect={setSelectedTab}>
        <div>
          <ul className="nav">
            <li>
              <TabLink to="users">
                <Translate>Users</Translate>
              </TabLink>
            </li>
            <li>
              <TabLink to="usergroups">
                <Translate>Groups</Translate>
              </TabLink>
            </li>
          </ul>
        </div>
        <TabContent for="users">
          <Users />
        </TabContent>
        <TabContent for="usergroups">
          <UserGroups />
        </TabContent>
      </Tabs>
    </div>
  );
};
