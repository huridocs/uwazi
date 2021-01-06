import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { IImmutable } from 'shared/types/Immutable';
import { UserSchema } from 'shared/types/userType';
import { UserRole } from 'shared/types/userSchema';
import { IStore } from 'app/istore';
import { UserList } from 'app/Users/components/UserList';
import { loadUsers, saveUser, deleteUser } from 'app/Users/actions/actions';
import { UserSidePanel } from 'app/Users/components/UserSidePanel';

export interface UserProps {
  users: IImmutable<UserSchema[]>;
  loadUsers: () => Promise<void>;
  saveUser: (user: UserSchema) => Promise<void>;
  deleteUser: (user: UserSchema) => Promise<void>;
}
const UsersComponent = ({
  users,
  loadUsers: loadAllUsers,
  saveUser: saveUserData,
  deleteUser: deleteUserData,
}: UserProps) => {
  const userList = users ? users.toJS() : [];
  const [selectedUser, setSelectedUser] = useState<UserSchema>();
  const [sidePanelOpened, setSidePanelOpened] = useState(false);

  useEffect(() => {
    if (userList.length === 0) {
      loadAllUsers()
        .then()
        .catch(() => {});
    }
  }, []);

  const closeSidePanel = () => {
    setSelectedUser(undefined);
    setSidePanelOpened(false);
  };

  const handlers = {
    handleSelect: (user: UserSchema) => {
      setSelectedUser(user);
      setSidePanelOpened(true);
    },

    handleSave: async (user: UserSchema) => {
      await saveUserData(user);
      closeSidePanel();
    },

    handleDelete: async (user: UserSchema) => {
      await deleteUserData(user);
      closeSidePanel();
    },

    handleAddUser: () => {
      setSelectedUser({ role: UserRole.COLLABORATOR });
      setSidePanelOpened(true);
    },
  };

  return (
    <>
      <UserList
        users={userList}
        handleSelect={handlers.handleSelect}
        handleAddUser={handlers.handleAddUser}
        className={sidePanelOpened ? 'edition-mode' : ''}
      />
      {selectedUser && (
        <UserSidePanel
          key={selectedUser._id?.toString()}
          opened={sidePanelOpened}
          user={selectedUser}
          users={userList}
          onSave={handlers.handleSave}
          onDelete={handlers.handleDelete}
          closePanel={closeSidePanel}
        />
      )}
    </>
  );
};

const mapStateToProps = (state: IStore & { users: IImmutable<UserSchema[]> }) => ({
  users: state.users,
});

const mapDispatchToProps = {
  loadUsers,
  saveUser,
  deleteUser,
};

export const Users = connect(mapStateToProps, mapDispatchToProps)(UsersComponent);
