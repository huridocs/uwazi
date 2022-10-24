import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { IImmutable } from 'shared/types/Immutable';
import { ClientUserSchema } from 'app/apiResponseTypes';
import { UserRole } from 'shared/types/userSchema';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import { IStore } from 'app/istore';
import { UserList } from 'app/Users/components/UserList';
import { loadUsers, saveUser, deleteUser, newUser } from 'app/Users/actions/actions';
import { loadUserGroups } from 'app/Users/components/usergroups/actions/actions';
import { UserSidePanel } from 'app/Users/components/UserSidePanel';
import { ClientUserGroupSchema } from 'app/apiResponseTypes';
import { reset2fa } from 'app/Auth2fa/actions/actions';
import { recoverPassword } from 'app/Auth/actions';

interface UserProps {
  users: IImmutable<ClientUserSchema[]>;
  userGroups: IImmutable<ClientUserGroupSchema[]>;
  loadUsers: () => Promise<void>;
  loadUserGroups: () => Promise<void>;
  newUser: (user: ClientUserSchema) => Promise<void>;
  saveUser: (user: ClientUserSchema) => Promise<void>;
  deleteUser: (user: { _id: ObjectIdSchema }) => Promise<void>;
  reset2fa: (user: ClientUserSchema) => Promise<void>;
  recoverPassword: (email: string) => Promise<void>;
}
const UsersComponent = ({
  users,
  userGroups,
  loadUsers: loadAllUsers,
  loadUserGroups: loadAllGroups,
  newUser: createUser,
  saveUser: saveUserData,
  deleteUser: deleteUserData,
  reset2fa: resetTwoFactorAuth,
  recoverPassword: resetUserPassword,
}: UserProps) => {
  const userList = users ? users.toJS() : [];
  const userGroupList = userGroups ? userGroups.toJS() : [];
  const [selectedUser, setSelectedUser] = useState<ClientUserSchema>();
  const [sidePanelOpened, setSidePanelOpened] = useState(false);

  useEffect(() => {
    if (userList.length === 0) {
      loadAllUsers()
        .then()
        .catch(() => {});
    }
    if (loadAllGroups.length === 0) {
      loadAllGroups()
        .then()
        .catch(() => {});
    }
  }, []);

  const closeSidePanel = () => {
    setSelectedUser(undefined);
    setSidePanelOpened(false);
  };

  const handlers = {
    handleSelect: (user: ClientUserSchema) => {
      setSelectedUser(user);
      setSidePanelOpened(true);
    },

    handleSave: async (user: ClientUserSchema) => {
      if (!user.password) {
        delete user.password;
      }
      delete user.using2fa;
      if (user._id) {
        await saveUserData(user);
      } else {
        delete user._id;
        await createUser(user);
      }
      await loadAllGroups();
      closeSidePanel();
    },

    handleDelete: async (user: ClientUserSchema) => {
      await deleteUserData({ _id: user._id! });
      closeSidePanel();
    },

    handleAddUser: () => {
      setSelectedUser({ role: UserRole.COLLABORATOR, username: '', email: '' });
      setSidePanelOpened(true);
    },

    handleResetPassword: async (user: ClientUserSchema) => {
      await resetUserPassword(user.email);
    },
  };

  return (
    <>
      <UserList
        users={userList}
        handleSelect={handlers.handleSelect}
        handleAddUser={handlers.handleAddUser}
        className={sidePanelOpened ? 'with-sidepanel' : ''}
      />
      {selectedUser && (
        <UserSidePanel
          key={selectedUser._id?.toString()}
          opened={sidePanelOpened}
          user={selectedUser}
          users={userList}
          groups={userGroupList}
          onSave={handlers.handleSave}
          onDelete={handlers.handleDelete}
          onReset2fa={resetTwoFactorAuth}
          closePanel={closeSidePanel}
          onResetPassword={handlers.handleResetPassword}
        />
      )}
    </>
  );
};

const mapStateToProps = (state: IStore & { users: IImmutable<ClientUserSchema[]> }) => ({
  users: state.users,
  userGroups: state.userGroups,
});

const mapDispatchToProps = {
  loadUsers,
  newUser,
  saveUser,
  deleteUser,
  loadUserGroups,
  reset2fa,
  recoverPassword,
};

export type { UserProps };
export const Users = connect(mapStateToProps, mapDispatchToProps)(UsersComponent);
