import React from 'react';
import { Tabs, TabList, Tab, TabPanel } from 'react-tabs';
import { Translate } from 'app/I18N';
import { SettingsHeader } from 'app/Settings/components/SettingsHeader';
import { UserGroups } from './components/usergroups/UserGroups';
import { Users } from './components/Users';

export const roleTranslationKey: { [role: string]: string } = {
  admin: 'Admin',
  editor: 'Editor',
  collaborator: 'Collaborator',
};

export const UserManagement = () => (
  <div className="settings-content">
    <div className="panel panel-default">
      <SettingsHeader>
        <Translate>Users</Translate>
      </SettingsHeader>
      <div className="userManagementTabs">
        <Tabs defaultIndex={1} className="tabs">
          <TabList>
            <Tab>
              <Translate>Users</Translate>
            </Tab>
            <Tab>
              <Translate>Groups</Translate>
            </Tab>
          </TabList>
          <TabPanel>
            <Users />
          </TabPanel>
          <TabPanel>
            <UserGroups />
          </TabPanel>
        </Tabs>
      </div>
    </div>
  </div>
);
