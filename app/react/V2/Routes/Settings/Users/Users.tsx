/* eslint-disable max-lines */
import React, { useRef, useState } from 'react';
import { IncomingHttpHeaders } from 'http';
import { ActionFunction, LoaderFunction, useFetcher, useLoaderData } from 'react-router-dom';
import { Translate } from 'app/I18N';
import { Button, ConfirmationModal, Table, Tabs } from 'V2/Components/UI';
import * as usersAPI from 'V2/api/users';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';
import {
  UserFormSidepanel,
  GroupFormSidepanel,
  getUsersColumns,
  getGroupsColumns,
  ListOfItems,
} from './components';
import { useHandleNotifications } from './useHandleNotifications';
import { FormIntent, User, Group } from './types';

type ActiveTab = 'Groups' | 'Users';

// eslint-disable-next-line max-statements
const Users = () => {
  const { users, groups } =
    (useLoaderData() as {
      users: User[];
      groups: Group[];
    }) || [];

  const [activeTab, setActiveTab] = useState<ActiveTab>('Users');
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<Group[]>([]);
  const [sidepanelData, setSidepanelData] = useState<User | Group | undefined>();
  const [showSidepanel, setShowSidepanel] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationModalProps, setConfirmationModalProps] = useState({
    header: 'Delete',
    body: 'Do you want to delete?',
  });

  const password = useRef<string>();
  const bulkActionIntent = useRef<FormIntent>();
  const fetcher = useFetcher();
  useHandleNotifications();

  const usersTableColumns = getUsersColumns((user: User) => {
    setShowSidepanel(true);
    setSidepanelData(user);
  });

  const groupsTableColumns = getGroupsColumns((group: Group) => {
    setShowSidepanel(true);
    setSidepanelData(group);
  });

  const handleBulkAction = () => {
    const formData = new FormData();
    formData.set('intent', bulkActionIntent.current || '');

    if (activeTab === 'Users') {
      formData.set('data', JSON.stringify(selectedUsers));
    } else {
      formData.set('data', JSON.stringify(selectedGroups));
    }

    formData.set('confirmation', password.current || '');

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
              setSidepanelData(undefined);
            }}
          >
            <Tabs.Tab id="Users" label={<Translate>Users</Translate>}>
              <Table
                data={users}
                columns={usersTableColumns}
                header={
                  <Translate className="text-base font-semibold text-left text-gray-900 bg-white">
                    Users
                  </Translate>
                }
                enableSelections
                onChange={({ selectedRows }) => {
                  setSelectedUsers(() => users.filter(user => user.rowId in selectedRows));
                }}
                defaultSorting={[{ id: 'username', desc: false }]}
              />
            </Tabs.Tab>

            <Tabs.Tab id="Groups" label={<Translate>Groups</Translate>}>
              <Table
                data={groups}
                columns={groupsTableColumns}
                header={
                  <Translate className="text-base font-semibold text-left text-gray-900 bg-white">
                    Groups
                  </Translate>
                }
                enableSelections
                onChange={({ selectedRows }) => {
                  setSelectedGroups(() => groups.filter(group => group.rowId in selectedRows));
                }}
                defaultSorting={[{ id: 'name', desc: false }]}
              />
            </Tabs.Tab>
          </Tabs>
        </SettingsContent.Body>

        <SettingsContent.Footer>
          <div className="flex gap-2">
            {selectedUsers.length ? (
              <>
                <Button
                  styling="light"
                  onClick={() => {
                    setConfirmationModalProps({
                      header: 'Reset passwords',
                      body: 'Do you want reset the password for the following users?',
                    });
                    bulkActionIntent.current = 'bulk-reset-password';
                    setShowConfirmationModal(true);
                  }}
                >
                  <Translate>Reset Password</Translate>
                </Button>

                <Button
                  styling="light"
                  onClick={() => {
                    setConfirmationModalProps({
                      header: 'Reset 2FA',
                      body: 'Do you want disable 2FA for the following users?',
                    });
                    bulkActionIntent.current = 'bulk-reset-2fa';
                    setShowConfirmationModal(true);
                  }}
                >
                  <Translate>Reset 2FA</Translate>
                </Button>
              </>
            ) : undefined}

            {selectedUsers.length || selectedGroups.length ? (
              <Button
                color="error"
                onClick={() => {
                  setConfirmationModalProps({
                    header: 'Delete',
                    body: 'Do you want to delete the following items?',
                  });
                  bulkActionIntent.current =
                    activeTab === 'Users' ? 'delete-users' : 'delete-groups';
                  setShowConfirmationModal(true);
                }}
              >
                <Translate>Delete</Translate>
              </Button>
            ) : undefined}

            {!selectedUsers.length && !selectedGroups.length ? (
              <Button
                onClick={() => {
                  setSidepanelData(undefined);
                  setShowSidepanel(true);
                }}
              >
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
          selectedUser={sidepanelData as User}
          showSidepanel={showSidepanel}
          setShowSidepanel={setShowSidepanel}
          setSelected={setSidepanelData}
          users={users}
          groups={groups}
        />
      ) : (
        <GroupFormSidepanel
          selectedGroup={sidepanelData as Group}
          showSidepanel={showSidepanel}
          setShowSidepanel={setShowSidepanel}
          setSelected={setSidepanelData}
          users={users}
          groups={groups}
        />
      )}

      {showConfirmationModal && (
        <ConfirmationModal
          header={confirmationModalProps.header}
          warningText={confirmationModalProps.body}
          body={<ListOfItems items={selectedUsers.length ? selectedUsers : selectedGroups} />}
          usePassword={
            (selectedUsers.length > 0 &&
              ['bulk-reset-2fa', 'delete-users'].includes(bulkActionIntent.current || '')) ||
            false
          }
          onAcceptClick={value => {
            password.current = value;
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
    const users = (await usersAPI.get(headers)).map(user => ({ ...user, rowId: user._id! }));
    const groups = (await usersAPI.getUserGroups(headers)).map(group => ({
      ...group,
      rowId: group._id!,
    }));
    return { users, groups };
  };

const userAction =
  (): ActionFunction =>
  async ({ request }) => {
    const formData = await request.formData();
    const formIntent = formData.get('intent') as FormIntent;

    const formValues = JSON.parse(formData.get('data') as string);
    const confirmation = formData.get('confirmation') as string;

    switch (formIntent) {
      case 'new-user':
        return usersAPI.newUser(formValues, confirmation);
      case 'edit-user':
        return usersAPI.updateUser(formValues, confirmation);
      case 'delete-users':
        return usersAPI.deleteUser(formValues, confirmation);
      case 'new-group':
      case 'edit-group':
        return usersAPI.saveGroup(formValues);
      case 'delete-groups':
        return usersAPI.deleteGroup(formValues);
      case 'unlock-user':
        return usersAPI.unlockAccount(formValues, confirmation);
      case 'reset-password':
      case 'bulk-reset-password':
        return usersAPI.resetPassword(formValues);
      case 'reset-2fa':
      case 'bulk-reset-2fa':
        return usersAPI.reset2FA(formValues, confirmation);
      default:
        return null;
    }
  };

export { Users, usersLoader, userAction };
