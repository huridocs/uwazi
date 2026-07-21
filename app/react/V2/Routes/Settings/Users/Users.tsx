/* eslint-disable max-lines */
import React, { useRef, useState } from 'react';
import { useLoaderData, useRevalidator } from 'react-router';
import { t, Translate } from '#app/I18N/index.js';
import { Button, ConfirmationModal, Table, Tabs } from '#V2/Components/UI/index.js';
import { SettingsContent } from '#V2/Components/Layouts/SettingsContent.js';
import { useRequestStatus } from '#V2/atoms/requestStatusAtom.js';
import { useServices } from '#V2/services/index.js';
import {
  UserFormSidepanel,
  GroupFormSidepanel,
  getUsersColumns,
  getGroupsColumns,
  ListOfItems,
} from './components/index.js';
import { User, Group } from './types.js';

type ActiveTab = 'Groups' | 'Users';

type BulkAction = 'delete-users' | 'delete-groups' | 'bulk-reset-password' | 'bulk-reset-2fa';

// eslint-disable-next-line max-statements
const Users = () => {
  const { users, groups } =
    (useLoaderData() as {
      users: User[];
      groups: Group[];
    }) || [];

  const { users: usersService, userGroups: userGroupsService } = useServices();
  const revalidator = useRevalidator();
  const { notify } = useRequestStatus();

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
  const bulkActionIntent = useRef<BulkAction>();

  const usersTableColumns = getUsersColumns((user: User) => {
    setShowSidepanel(true);
    setSidepanelData(user);
  });

  const groupsTableColumns = getGroupsColumns((group: Group) => {
    setShowSidepanel(true);
    setSidepanelData(group);
  });

  const notifyMutationError = (error: { detail?: string; message: string }) => {
    notify(
      'error',
      t('System', 'An error occurred', null, false),
      undefined,
      error.detail ?? error.message
    );
  };

  const handleBulkAction = async () => {
    const intent = bulkActionIntent.current;
    const confirmation = password.current || '';
    let error;

    switch (intent) {
      case 'delete-users':
        [, error] = await usersService.delete(selectedUsers, confirmation);
        if (!error) {
          notify('success', t('System', 'Deleted user', null, false));
        }
        break;
      case 'delete-groups':
        [, error] = await userGroupsService.delete(selectedGroups);
        if (!error) {
          notify('success', t('System', 'Deleted user group', null, false));
        }
        break;
      case 'bulk-reset-password':
        [, error] = await usersService.requestPasswordReset(selectedUsers);
        if (!error) {
          notify(
            'success',
            t('System', 'Instructions to reset the password were sent to the user', null, false)
          );
        }
        break;
      case 'bulk-reset-2fa':
        [, error] = await usersService.reset2FA(selectedUsers, confirmation);
        if (!error) {
          notify('success', t('System', 'Disabled 2FA', null, false));
        }
        break;
      default:
        return;
    }

    if (error) {
      notifyMutationError(error);
      return;
    }

    await revalidator.revalidate();
  };

  return (
    <div className="w-full h-full overflow-y-auto" data-testid="settings-users">
      <SettingsContent>
        <SettingsContent.Header title="Users & Groups" />

        <SettingsContent.Body>
          <Tabs
            groupId="settings-users"
            tabListClassName="md:w-2/3 w-full"
            activeTabId={activeTab}
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
                  <Translate className="text-left text-base font-semibold text-ink">
                    Users
                  </Translate>
                }
                enableSelections
                onSelect={({ selectedRows }) => {
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
                  <Translate className="text-left text-base font-semibold text-ink">
                    Groups
                  </Translate>
                }
                enableSelections
                onSelect={({ selectedRows }) => {
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
                  variant="ghost"
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
                  variant="ghost"
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
                variant="danger"
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
          onAcceptClick={async value => {
            password.current = value;
            await handleBulkAction();
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

export { Users };
