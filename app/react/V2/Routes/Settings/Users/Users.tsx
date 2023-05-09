import React, { useState } from 'react';
import { IncomingHttpHeaders } from 'http';
import { LoaderFunction, useLoaderData } from 'react-router-dom';
import { ClientUserGroupSchema, ClientUserSchema } from 'app/apiResponseTypes';
import { Translate } from 'app/I18N';
import { Button, NavigationHeader, Tabs } from 'V2/Components/UI';
import { SettingsFooter } from 'V2/Components/Settings/SettingsFooter';
import * as usersAPI from 'V2/api/users';
import { UserFormSidepanel, GroupFormSidepanel } from 'V2/Components/Settings/UsersAndGroups';
import { UsersTable } from './UsersTable';
import { GroupsTable } from './GroupsTable';

type activeTab = 'Groups' | 'Users';

const Users = () => {
  const [activeTab, setActiveTab] = useState<activeTab>('Users');
  const [selectedUsers, setSelectedUsers] = useState<ClientUserSchema[]>([]);
  const [selected, setSelected] = useState<ClientUserSchema | ClientUserGroupSchema | undefined>();
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

        <Tabs onTabSelected={tab => setActiveTab(tab as activeTab)}>
          <Tabs.Tab id="Users" label={<Translate>Users</Translate>}>
            <UsersTable
              users={users}
              editButtonAction={selectedUser => {
                setSelected(selectedUser);
                setShowSidepanel(true);
              }}
              onUsersSelected={selectedTableUsers => setSelectedUsers(selectedTableUsers)}
            />
          </Tabs.Tab>
          <Tabs.Tab id="Groups" label={<Translate>Groups</Translate>}>
            <GroupsTable
              groups={groups}
              editButtonAction={selectedGroup => {
                setSelected(selectedGroup);
                setShowSidepanel(true);
              }}
              onGroupsSelected={selectedGroups => setSelectedGroups(selectedGroups)}
            />
          </Tabs.Tab>
        </Tabs>
      </div>

      <SettingsFooter>
        <div className="flex gap-2 p-2 pt-1">
          {selectedUsers.length > 0 ? (
            <>
              <Button size="small" buttonStyle="tertiary" formId="edit-translations">
                <Translate>Reset password</Translate>
              </Button>
              <Button size="small" buttonStyle="danger" formId="edit-translations">
                <Translate>Delete</Translate>
              </Button>
            </>
          ) : (
            <Button
              size="small"
              buttonStyle="primary"
              formId="edit-translations"
              onClick={() => setShowSidepanel(true)}
            >
              {activeTab === 'Users' ? (
                <Translate>Add user</Translate>
              ) : (
                <Translate>Add group</Translate>
              )}
            </Button>
          )}
        </div>
      </SettingsFooter>

      {activeTab === 'Users' ? (
        <UserFormSidepanel
          selectedUser={selected as ClientUserSchema}
          showSidepanel={showSidepanel}
          setShowSidepanel={setShowSidepanel}
          setSelected={setSelected}
        />
      ) : (
        <GroupFormSidepanel
          selectedGroup={selected as ClientUserGroupSchema}
          showSidepanel={showSidepanel}
          setShowSidepanel={setShowSidepanel}
          setSelected={setSelected}
        />
      )}
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
