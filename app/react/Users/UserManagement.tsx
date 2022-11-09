import React, { useState } from 'react';
import { TabContent, TabLink, Tabs } from 'react-tabs-redux';
import { Icon } from 'UI';
import { I18NLink, Translate } from 'app/I18N';
import { UserGroups } from './components/usergroups/UserGroups';
import { Users } from './components/Users';

export const roleTranslationKey: { [role: string]: string } = {
  admin: 'Admin',
  editor: 'Editor',
  collaborator: 'Collaborator',
};

export const UserManagement = () => {
  const [selectedTab, setSelectedTab] = useState('users');
  return (
    <div className="settings-content">
      <div className="panel panel-default">
        <div className="panel-heading">
          <I18NLink to="settings/" className="only-mobile">
            <Icon icon="arrow-left" directionAware />
            <span className="btn-label">
              <Translate>Back</Translate>
            </span>
          </I18NLink>
          <Translate>Users</Translate>
        </div>
        <div className="userManagementTabs">
          <Tabs selectedTab={selectedTab} renderActiveTabContentOnly handleSelect={setSelectedTab}>
            <div>
              <ul className="nav">
                <li>
                  <TabLink to="users" component="div">
                    <Translate>Users</Translate>
                  </TabLink>
                </li>
                <li>
                  <TabLink to="usergroups" component="div">
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
      </div>
    </div>
  );
};
