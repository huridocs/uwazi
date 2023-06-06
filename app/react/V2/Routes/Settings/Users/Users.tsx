import React, { useEffect, useState } from 'react';
import { IncomingHttpHeaders } from 'http';
import { useSetRecoilState } from 'recoil';
import {
  ActionFunction,
  LoaderFunction,
  useFetcher,
  useFetchers,
  useLoaderData,
} from 'react-router-dom';
import { last } from 'lodash';
import { Row } from '@tanstack/react-table';
import { ClientUserGroupSchema, ClientUserSchema } from 'app/apiResponseTypes';
import { Translate } from 'app/I18N';
import { ConfirmationModal, Table, Tabs } from 'V2/Components/UI';
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
import { ActionButtons } from './components/ActionButtons';

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
  const fetchers = useFetchers();

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
    if (!fetchers.length) return;

    const lastFetcherCall = last(fetchers) || fetchers[0];
    const intent = lastFetcherCall.formData?.get('intent') as FormIntent;
    const { data } = lastFetcherCall;

    if (data instanceof FetchResponseError) {
      setNotifications({
        type: 'error',
        text: <Translate>An error occurred</Translate>,
        details: data.json?.prettyMessage ? data.json?.prettyMessage : undefined,
      });

      return;
    }

    switch (intent) {
      case 'new-user':
        setNotifications({
          type: 'success',
          text: <Translate>User saved</Translate>,
        });
        break;

      case 'edit-user':
        setNotifications({
          type: 'success',
          text: <Translate>User updated</Translate>,
        });
        break;

      case 'new-group':
        setNotifications({
          type: 'success',
          text: <Translate>Group saved</Translate>,
        });
        break;

      case 'edit-group':
        setNotifications({
          type: 'success',
          text: <Translate>Group updated</Translate>,
        });
        break;

      case 'delete-users':
        setNotifications({
          type: 'success',
          text: <Translate>Users deleted</Translate>,
        });
        break;

      case 'delete-groups':
        setNotifications({
          type: 'success',
          text: <Translate>Groups deleted</Translate>,
        });
        break;

      default:
        break;
    }
  }, [fetchers, setNotifications]);

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
          <ActionButtons
            selectedUsers={selectedUsers}
            selectedGroups={selectedGroups}
            activeTab={activeTab}
            deleteAction={() => {
              setShowDeleteModal(true);
            }}
            createAction={() => {
              setShowSidepanel(true);
            }}
          />
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
