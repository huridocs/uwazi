import React, { useState } from 'react';
import { IncomingHttpHeaders } from 'http';
import { Tab, Tabs } from 'app/V2/Components/UI';
import { ClientUserGroupSchema, ClientUserSchema } from 'app/apiResponseTypes';
import { Translate } from 'app/I18N';
import { Button } from 'app/V2/Components/UI';
import { UsersTable } from './UsersTable';
import { GroupsTable } from './GroupsTable';
import { LoaderFunction, useLoaderData } from 'react-router-dom';
import * as usersAPI from 'V2/api/users';

const Users = () => {
  const [activeTab, setActiveTab] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<ClientUserSchema[]>([]);
  const [, setSelectedGroups] = useState<ClientUserGroupSchema[]>([]);

  const { users, groups } =
    (useLoaderData() as { users: ClientUserSchema[]; groups: ClientUserGroupSchema[] }) || [];
  return (
    <div className="tw-content" style={{ width: '100%', overflowY: 'auto', paddingTop: '12px' }}>
      <div className="p-4 h-full">
        <h2 className="text-gray-700 font-normal mb-2">Users & Groups</h2>
        <Tabs onTabSelected={tab => setActiveTab(tab)}>
          <Tab label="Users">
            <UsersTable
              users={users}
              onUsersSelected={selectedTableUsers => setSelectedUsers(selectedTableUsers)}
            />
          </Tab>
          <Tab label="Groups">
            <GroupsTable
              groups={groups}
              onGroupsSelected={selectedGroups => setSelectedGroups(selectedGroups)}
            />
          </Tab>
        </Tabs>
      </div>
      <div className="fixed bottom-0 left-0 w-full p-1 bg-white border-t border-gray-200 lg:sticky z-1">
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
              <Button size="small" buttonStyle="primary" formId="edit-translations">
                <Translate>{`Add ${activeTab === 'Groups' ? 'group' : 'user'}`}</Translate>
              </Button>
            );
          })()}
        </div>
      </div>
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
