import React, { useState } from 'react';
import { IncomingHttpHeaders } from 'http';
import { ActionFunction, LoaderFunction, useFetcher, useLoaderData } from 'react-router-dom';
import { ClientUserGroupSchema, ClientUserSchema } from 'app/apiResponseTypes';
import { Translate } from 'app/I18N';
import { Button, NavigationHeader, Tabs } from 'V2/Components/UI';
import { SettingsFooter } from 'V2/Components/Settings/SettingsFooter';
import * as usersAPI from 'V2/api/users';
import {
  UserFormSidepanel,
  GroupFormSidepanel,
  DeleteConfirmationModal,
} from 'V2/Components/Settings/UsersAndGroups';
import { UsersTable } from './UsersTable';
import { GroupsTable } from './GroupsTable';

type activeTab = 'Groups' | 'Users';

const Users = () => {
  const [activeTab, setActiveTab] = useState<activeTab>('Users');
  const [selectedUsers, setSelectedUsers] = useState<ClientUserSchema[]>([]);
  const [selected, setSelected] = useState<ClientUserSchema | ClientUserGroupSchema | undefined>();
  const [showSidepanel, setShowSidepanel] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<ClientUserGroupSchema[]>([]);
  const { users, groups } =
    (useLoaderData() as { users: ClientUserSchema[]; groups: ClientUserGroupSchema[] }) || [];
  const fetcher = useFetcher();

  return (
    <div className="tw-content" style={{ width: '100%', overflowY: 'auto' }}>
      <div className="flex flex-col h-full">
        <div className="flex-grow px-5 pt-5">
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
                <Button size="small" styling="light">
                  <Translate>Reset password</Translate>
                </Button>
                <Button size="small" styling="light">
                  <Translate>Reset 2FA</Translate>
                </Button>
                <Button
                  size="small"
                  color="error"
                  onClick={() => {
                    setShowDeleteModal(true);
                  }}
                >
                  <Translate>Delete</Translate>
                </Button>
              </>
            ) : (
              <Button
                size="small"
                onClick={() => {
                  setShowSidepanel(true);
                }}
              >
                {activeTab === 'Users' ? (
                  <Translate>Add user</Translate>
                ) : (
                  <Translate>Add group</Translate>
                )}
              </Button>
            )}
            {selectedGroups.length > 0 ? (
              <Button
                size="small"
                color="error"
                onClick={() => {
                  setShowDeleteModal(true);
                }}
              >
                <Translate>Delete</Translate>
              </Button>
            ) : (
              <></>
            )}
          </div>
        </SettingsFooter>
      </div>

      {activeTab === 'Users' ? (
        <UserFormSidepanel
          showSidepanel={showSidepanel}
          setShowSidepanel={setShowSidepanel}
          setSelected={setSelected}
          selectedUser={selected as ClientUserSchema}
          users={users}
          groups={groups}
        />
      ) : (
        <GroupFormSidepanel
          selectedGroup={selected as ClientUserGroupSchema}
          showSidepanel={showSidepanel}
          setShowSidepanel={setShowSidepanel}
          setSelected={setSelected}
          users={users}
          groups={groups}
        />
      )}

      {showDeleteModal && (
        <DeleteConfirmationModal
          setShowModal={setShowDeleteModal}
          onConfirm={() => {
            setShowDeleteModal(false);
            // Delete user
            const formData = new FormData();
            if (activeTab === 'Users') {
              formData.set('intent', 'delete-user');
              formData.set('data', JSON.stringify(selectedUsers[0]));
            } else {
              formData.set('intent', 'delete-group');
              formData.set('data', JSON.stringify(selectedGroups[0]));
            }
            fetcher.submit(formData, { method: 'post' });
          }}
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

const settingsUserAction =
  (): ActionFunction =>
  async ({ request }) => {
    const formData = await request.formData();
    const formIntent = formData.get('intent') as
      | 'new-user'
      | 'edit-user'
      | 'delete-user'
      | 'new-group'
      | 'edit-group'
      | 'delete-group';

    const formValues = JSON.parse(formData.get('data') as string);

    switch (formIntent) {
      case 'new-user':
        return usersAPI.newUser(formValues);
      case 'edit-user':
        return usersAPI.saveUser(formValues);
      case 'delete-user':
        return usersAPI.deleteUser(formValues);
      case 'new-group':
      case 'edit-group':
        return usersAPI.saveGroup(formValues);
      case 'delete-group':
        return usersAPI.deleteGroup(formValues);
      default:
        return null;
    }
  };

export { Users, usersLoader, settingsUserAction };
