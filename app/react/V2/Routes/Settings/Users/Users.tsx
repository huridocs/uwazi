import React, { useEffect, useState } from 'react';
import { IncomingHttpHeaders } from 'http';
import { useSetRecoilState } from 'recoil';
import { ActionFunction, LoaderFunction, useFetcher, useLoaderData } from 'react-router-dom';
import { Row } from '@tanstack/react-table';
import { ClientUserGroupSchema, ClientUserSchema } from 'app/apiResponseTypes';
import { Translate } from 'app/I18N';
import { Button, ConfirmationModal, Table, Tabs } from 'V2/Components/UI';
import * as usersAPI from 'V2/api/users';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';
import { notificationAtom } from 'app/V2/atoms';
import { FetchResponseError } from 'shared/JSONRequest';
import {
  UserFormSidepanel,
  GroupFormSidepanel,
  getUsersColumns,
  getGroupsTableColumns,
} from './components';

type ActiveTab = 'Groups' | 'Users';
type FormIntent =
  | 'new-user'
  | 'edit-user'
  | 'delete-users'
  | 'new-group'
  | 'edit-group'
  | 'delete-groups';

// eslint-disable-next-line max-statements
const Users = () => {
  const { users, groups } =
    (useLoaderData() as { users: ClientUserSchema[]; groups: ClientUserGroupSchema[] }) || [];

  const setNotifications = useSetRecoilState(notificationAtom);
  const [activeTab, setActiveTab] = useState<ActiveTab>('Users');
  const [selectedUsers, setSelectedUsers] = useState<Row<ClientUserSchema>[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<Row<ClientUserGroupSchema>[]>([]);
  const [selected, setSelected] = useState<ClientUserSchema | ClientUserGroupSchema | undefined>();
  const [showSidepanel, setShowSidepanel] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const fetcher = useFetcher();

  const usersTableColumns = getUsersColumns((user: ClientUserSchema) => {
    setShowSidepanel(true);
    setSelected(user);
  });

  const groupsTableColumns = getGroupsTableColumns((group: ClientUserGroupSchema) => {
    setShowSidepanel(true);
    setSelected(group);
  });

  const handleSave = () => {
    const formData = new FormData();

    if (activeTab === 'Users') {
      formData.set('intent', 'delete-users');
      formData.set('data', JSON.stringify(selectedUsers.map(user => user.original)));
      setSelectedUsers([]);
    } else {
      formData.set('intent', 'delete-groups');
      formData.set('data', JSON.stringify(selectedGroups.map(group => group.original)));
      setSelectedGroups([]);
    }

    setShowDeleteModal(false);
    fetcher.submit(formData, { method: 'post' });
  };

  useEffect(() => {
    const intent = fetcher.formData?.get('intent');

    switch (true) {
      case intent === 'delete-groups':
        setNotifications({
          type: 'success',
          text: <Translate>Groups deleted</Translate>,
        });
        break;

      case intent === 'delete-users':
        setNotifications({
          type: 'success',
          text: <Translate>Users deleted</Translate>,
        });
        break;

      case fetcher.data instanceof FetchResponseError:
        setNotifications({
          type: 'error',
          text: <Translate>An error occurred</Translate>,
          details: fetcher.data.json?.prettyMessage ? fetcher.data.json?.prettyMessage : undefined,
        });
        break;

      default:
        break;
    }
  }, [fetcher.data, fetcher.formData, setNotifications]);

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
                <Button size="small" styling="light">
                  <Translate>Reset password</Translate>
                </Button>
                <Button size="small" styling="light">
                  <Translate>Reset 2FA</Translate>
                </Button>
              </>
            ) : undefined}

            {selectedUsers.length || selectedGroups.length ? (
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

            {!selectedUsers.length && !selectedGroups.length ? (
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
        <ConfirmationModal
          header="Delete"
          body="Do you want to delete?"
          acceptButton="Delete"
          cancelButton="No, cancel"
          onAcceptClick={() => handleSave()}
          onCancelClick={() => setShowDeleteModal(false)}
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
      default:
        return null;
    }
  };

export { Users, usersLoader, userAction };
