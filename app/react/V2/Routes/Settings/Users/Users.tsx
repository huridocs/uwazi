/* eslint-disable max-lines */
import React, { useState } from 'react';
import { IncomingHttpHeaders } from 'http';
import { ActionFunction, LoaderFunction, useFetcher, useLoaderData } from 'react-router-dom';
import { Row } from '@tanstack/react-table';
import { ClientUserGroupSchema, ClientUserSchema } from 'app/apiResponseTypes';
import { Translate } from 'app/I18N';
import { Button, ConfirmationModal, Table, Tabs } from 'V2/Components/UI';
import * as usersAPI from 'V2/api/users';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';
import {
  UserFormSidepanel,
  GroupFormSidepanel,
  getUsersColumns,
  getGroupsColumns,
} from './components';
import { useHandleNotifications } from './useHandleNotifications';

type ActiveTab = 'Groups' | 'Users';
type FormIntent =
  | 'new-user'
  | 'edit-user'
  | 'delete-users'
  | 'new-group'
  | 'edit-group'
  | 'delete-groups'
  | 'unlock-user'
  | 'reset-password'
  | 'reset-2fa'
  | 'bulk-reset-2fa'
  | 'bulk-reset-password';

// eslint-disable-next-line max-statements
const Users = () => {
  const { users, groups } =
    (useLoaderData() as { users: ClientUserSchema[]; groups: ClientUserGroupSchema[] }) || [];

  const [activeTab, setActiveTab] = useState<ActiveTab>('Users');
  const [selectedUsers, setSelectedUsers] = useState<Row<ClientUserSchema>[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<Row<ClientUserGroupSchema>[]>([]);
  const [sidepanelSelection, setSidepanelSelection] = useState<
    ClientUserSchema | ClientUserGroupSchema | undefined
  >();
  const [showSidepanel, setShowSidepanel] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationModalProps, setConfirmationModalProps] = useState({
    header: 'Delete',
    body: 'Do you want to delete?',
  });
  const [bulkActionIntent, setBulkActionIntent] = useState<FormIntent>('delete-users');

  const fetcher = useFetcher();

  useHandleNotifications();

  const usersTableColumns = getUsersColumns((user: ClientUserSchema) => {
    setShowSidepanel(true);
    setSidepanelSelection(user);
  });

  const groupsTableColumns = getGroupsColumns((group: ClientUserGroupSchema) => {
    setShowSidepanel(true);
    setSidepanelSelection(group);
  });

  const handleBulkAction = () => {
    const formData = new FormData();
    formData.set('intent', bulkActionIntent);

    if (activeTab === 'Users') {
      formData.set('data', JSON.stringify(selectedUsers.map(user => user.original)));
    } else {
      formData.set('data', JSON.stringify(selectedGroups.map(group => group.original)));
    }

    fetcher.submit(formData, { method: 'post' });
  };

  return (
    <div className="tw-content" style={{ width: '100%', overflowY: 'auto' }}>
      <SettingsContent>
        <SettingsContent.Header title="Users & Groups" />

        <SettingsContent.Body>
          <Tabs
            onTabSelected={tab => {
              setActiveTab(tab as ActiveTab);
              setSelectedUsers([]);
              setSelectedGroups([]);
            }}
          >
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
              <Table<ClientUserGroupSchema>
                columns={groupsTableColumns}
                data={groups}
                title={<Translate>Groups</Translate>}
                enableSelection
                onSelection={setSelectedGroups}
                initialState={{ sorting: [{ id: 'name', desc: false }] }}
              />
            </Tabs.Tab>
          </Tabs>
        </SettingsContent.Body>

        <SettingsContent.Footer>
          <div className="flex gap-2 p-2 pt-1">
            {selectedUsers.length ? (
              <>
                <Button
                  size="small"
                  styling="light"
                  onClick={() => {
                    setConfirmationModalProps({
                      header: 'Reset passwords',
                      body: 'Do you want reset the password for all selected users?',
                    });
                    setBulkActionIntent('bulk-reset-password');
                    setShowConfirmationModal(true);
                  }}
                >
                  <Translate>Reset Password</Translate>
                </Button>

                <Button
                  size="small"
                  styling="light"
                  onClick={() => {
                    setConfirmationModalProps({
                      header: 'Reset 2FA',
                      body: 'Do you want disable 2FA for all selected users?',
                    });
                    setBulkActionIntent('bulk-reset-2fa');
                    setShowConfirmationModal(true);
                  }}
                >
                  <Translate>Reset 2FA</Translate>
                </Button>
              </>
            ) : undefined}

            {selectedUsers.length || selectedGroups.length ? (
              <Button
                size="small"
                color="error"
                onClick={() => {
                  setConfirmationModalProps({
                    header: 'Delete',
                    body: 'Do you want to delete the selected items?',
                  });
                  setBulkActionIntent(activeTab === 'Users' ? 'delete-users' : 'delete-groups');
                  setShowConfirmationModal(true);
                }}
              >
                <Translate>Delete</Translate>
              </Button>
            ) : undefined}

            {!selectedUsers.length && !selectedGroups.length ? (
              <Button size="small" onClick={() => setShowSidepanel(true)}>
                {activeTab === 'Users' ? (
                  <Translate>Add user</Translate>
                ) : (
                  <Translate>Add group</Translate>
                )}
              </Button>
            ) : undefined}
          </div>
        </SettingsContent.Footer>
      </SettingsContent>

      {activeTab === 'Users' ? (
        <UserFormSidepanel
          selectedUser={sidepanelSelection as ClientUserSchema}
          showSidepanel={showSidepanel}
          setShowSidepanel={setShowSidepanel}
          setSelected={setSidepanelSelection}
          users={users}
          groups={groups}
        />
      ) : (
        <GroupFormSidepanel
          selectedGroup={sidepanelSelection as ClientUserGroupSchema}
          showSidepanel={showSidepanel}
          setShowSidepanel={setShowSidepanel}
          setSelected={setSidepanelSelection}
          users={users}
          groups={groups}
        />
      )}

      {showConfirmationModal && (
        <ConfirmationModal
          header={confirmationModalProps.header}
          body={confirmationModalProps.body}
          onAcceptClick={() => {
            handleBulkAction();
            setShowConfirmationModal(false);
            setSelectedGroups([]);
            setSelectedUsers([]);
          }}
          onCancelClick={() => setShowConfirmationModal(false)}
          dangerStyle
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

const userAction =
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
      case 'delete-users':
        return usersAPI.deleteUser(formValues);
      case 'new-group':
      case 'edit-group':
        return usersAPI.saveGroup(formValues);
      case 'delete-groups':
        return usersAPI.deleteGroup(formValues);
      case 'unlock-user':
        return usersAPI.unlockAccount(formValues);
      case 'reset-password':
        return usersAPI.resetPassword(formValues);
      case 'reset-2fa':
        return usersAPI.reset2FA(formValues);
      case 'bulk-reset-2fa':
        return null;
      case 'bulk-reset-password':
        return null;
      default:
        return null;
    }
  };

export { Users, usersLoader, userAction };
