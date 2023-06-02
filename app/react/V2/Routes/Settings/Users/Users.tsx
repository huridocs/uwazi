import React, { useState } from 'react';
import { IncomingHttpHeaders } from 'http';
import { ActionFunction, LoaderFunction, useFetcher, useLoaderData } from 'react-router-dom';
import { Row } from '@tanstack/react-table';
import { ClientUserGroupSchema, ClientUserSchema } from 'app/apiResponseTypes';
import { Translate } from 'app/I18N';
import { Button, Table, Tabs } from 'V2/Components/UI';
import * as usersAPI from 'V2/api/users';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';
import {
  UserFormSidepanel,
  GroupFormSidepanel,
  DeleteConfirmationModal,
  getUsersColumns,
} from './components';

type ActiveTab = 'Groups' | 'Users';
type FormIntent =
  | 'new-user'
  | 'edit-user'
  | 'delete-user'
  | 'new-group'
  | 'edit-group'
  | 'delete-group';

const Users = () => {
  const { users, groups } =
    (useLoaderData() as { users: ClientUserSchema[]; groups: ClientUserGroupSchema[] }) || [];

  const [activeTab, setActiveTab] = useState<ActiveTab>('Users');
  const [selectedUsers, setSelectedUsers] = useState<Row<ClientUserSchema>[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<ClientUserGroupSchema[]>([]);
  const [selected, setSelected] = useState<ClientUserSchema | ClientUserGroupSchema | undefined>();
  const [showSidepanel, setShowSidepanel] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const fetcher = useFetcher();

  const usersTableColumns = getUsersColumns((user: ClientUserSchema) => {
    setShowSidepanel(true);
    setSelected(user);
  });

  return (
    <div className="tw-content" style={{ width: '100%', overflowY: 'auto' }}>
      <SettingsContent>
        <SettingsContent.Header title="Users & Groups" />

        <SettingsContent.Body>
          <Tabs onTabSelected={tab => setActiveTab(tab as ActiveTab)}>
            <Tabs.Tab id="Users" label={<Translate>Users</Translate>}>
              <Table<ClientUserSchema>
                columns={usersTableColumns}
                data={users}
                title={<Translate>Users</Translate>}
                enableSelection
                onSelection={setSelectedUsers}
                initialState={{ sorting: [{ id: 'username', desc: false }] }}
              />
            </Tabs.Tab>
            <Tabs.Tab id="Groups" label={<Translate>Groups</Translate>}>
              {/* <GroupsTable
                groups={groups}
                editButtonAction={selectedGroup => {
                  setSelected(selectedGroup);
                  setShowSidepanel(true);
                }}
                onGroupsSelected={selection => setSelectedGroups(selection)}
              /> */}
            </Tabs.Tab>
          </Tabs>
        </SettingsContent.Body>

        <SettingsContent.Footer>
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

            {selectedGroups.length > 0 && selectedUsers.length === 0 ? (
              <Button
                size="small"
                color="error"
                onClick={() => {
                  setShowDeleteModal(true);
                }}
              >
                <Translate>Delete</Translate>
              </Button>
            ) : undefined}
          </div>
        </SettingsContent.Footer>
      </SettingsContent>

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
    const formIntent = formData.get('intent') as FormIntent;

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
