import { TabContent, TabLink, Tabs } from 'react-tabs-redux';
import UsersList from 'app/Users/components/UsersList';
import UserGroups from 'app/Users/components/usergroups/UserGroups';
import React, { useState } from 'react';

export const UserManagement = () => {
  const [selectedTab, setSelectedTab] = useState('users');
  function handleSelect(choiceTab: string) {
    setSelectedTab(choiceTab);
  }
  return (
    <div className="userManagementTabs">
      <Tabs selectedTab={selectedTab} renderActiveTabContentOnly handleSelect={handleSelect}>
        <div>
          <TabLink to="users">Users</TabLink>
          <TabLink to="usergroups">Groups</TabLink>
        </div>
        <TabContent for="users">
          <UsersList />
        </TabContent>
        <TabContent for="usergroups">
          <UserGroups />
        </TabContent>
      </Tabs>
    </div>
  );
};
