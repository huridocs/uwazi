import React, { useState } from 'react';
import { IncomingHttpHeaders } from 'http';
import { LoaderFunction, useLoaderData } from 'react-router-dom';
import { ClientUserGroupSchema, ClientUserSchema } from 'app/apiResponseTypes';
import { Translate } from 'app/I18N';
import { Button, NavigationHeader, Sidepanel, Tab, Tabs } from 'V2/Components/UI';
import { SettingsFooter } from 'V2/Components/Settings/SettingsFooter';
import * as usersAPI from 'V2/api/users';
import { UsersTable } from './UsersTable';
import { GroupsTable } from './GroupsTable';

const Users = () => {
  const [activeTab, setActiveTab] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<ClientUserSchema[]>([]);
  const [dirtyUser, setDirtyUser] = useState<ClientUserSchema | null>();
  const [showSidepanel, setShowSidepanel] = useState(false);
  const [, setSelectedGroups] = useState<ClientUserGroupSchema[]>([]);
  const { users, groups } =
    (useLoaderData() as { users: ClientUserSchema[]; groups: ClientUserGroupSchema[] }) || [];

  return (
    <div className="tw-content" style={{ width: '100%', overflowY: 'auto', paddingTop: '12px' }}>
      <div className="p-4 h-full">
        <div className="pb-4">
          <NavigationHeader backUrl="/settings">
            <h1 className="flex gap-2 text-base text-gray-700 sm:gap-6">
              <Translate>Users & Groups</Translate>
            </h1>
          </NavigationHeader>
        </div>

        <Tabs onTabSelected={tab => setActiveTab(tab)}>
          <Tab label="Users">
            <UsersTable
              users={users}
              editButtonAction={userBeingEdited => {
                setDirtyUser(userBeingEdited);
                setShowSidepanel(true);
              }}
              onUsersSelected={selectedTableUsers => setSelectedUsers(selectedTableUsers)}
            />
          </Tab>
          <Tab label="Groups">
            <GroupsTable
              groups={groups}
              editButtonAction={() => setShowSidepanel(true)}
              onGroupsSelected={selectedGroups => setSelectedGroups(selectedGroups)}
            />
          </Tab>
        </Tabs>
      </div>

      <SettingsFooter>
        <div className="flex gap-2 p-2 pt-1">
          {(() => {
            if (selectedUsers.length > 0) {
              return (
                <>
                  <Button size="small" buttonStyle="tertiary" formId="edit-translations">
                    <Translate>Reset password</Translate>
                  </Button>
                  <Button size="small" buttonStyle="danger" formId="edit-translations">
                    <Translate>Delete</Translate>
                  </Button>
                </>
              );
            }
            return (
              <Button
                size="small"
                buttonStyle="primary"
                formId="edit-translations"
                onClick={() => setShowSidepanel(true)}
              >
                <Translate>{`Add ${activeTab === 'Groups' ? 'group' : 'user'}`}</Translate>
              </Button>
            );
          })()}
        </div>
      </SettingsFooter>

      <Sidepanel
        isOpen={showSidepanel}
        withOverlay
        closeSidepanelFunction={() => setShowSidepanel(false)}
        title={<Translate>User</Translate>}
      >
        {JSON.stringify(dirtyUser)}
      </Sidepanel>
    </div>
  );
};

const usersLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () => {
    const users = await usersAPI.get(headers);
    const groups = await usersAPI.getUserGroups(headers);
    return { users, groups };
  };

export { Users, usersLoader };
