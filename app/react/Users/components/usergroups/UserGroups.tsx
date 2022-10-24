import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { IImmutable } from 'shared/types/Immutable';
import { GroupMemberSchema, ClientUserGroupSchema } from 'app/apiResponseTypes';
import { IStore } from 'app/istore';
import { UserGroupList } from 'app/Users/components/usergroups/UserGroupList';
import {
  deleteUserGroup,
  loadUserGroups,
  saveUserGroup,
} from 'app/Users/components/usergroups/actions/actions';
import { loadUsers } from 'app/Users/actions/actions';
import { UserGroupSidePanel } from './UserGroupSidePanel';

export interface UserGroupProps {
  userGroups: IImmutable<ClientUserGroupSchema[]>;
  users: IImmutable<GroupMemberSchema[]>;
  loadUserGroups: () => any;
  saveUserGroup: (userGroup: ClientUserGroupSchema) => Promise<void>;
  deleteUserGroup: (userGroup: ClientUserGroupSchema) => Promise<void>;
  loadUsers: () => Promise<void>;
}

const UserGroupsComponent = ({
  userGroups,
  users,
  loadUserGroups: loadGroups,
  saveUserGroup: saveGroup,
  deleteUserGroup: deleteGroup,
  loadUsers: loadAllUsers,
}: UserGroupProps) => {
  const [sidePanelOpened, setSidePanelOpened] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<ClientUserGroupSchema>();
  const groupList = userGroups ? userGroups.toJS() : [];
  const userList = users ? users.toJS() : [];

  useEffect(() => {
    if (groupList.length === 0) {
      loadGroups().then();
    }
  }, []);

  function closeSidePanel() {
    setSelectedGroup(undefined);
    setSidePanelOpened(false);
  }

  const handlers = {
    handleSelect: (userGroup: ClientUserGroupSchema) => {
      setSelectedGroup(userGroup);
      setSidePanelOpened(true);
    },
    handleAddGroup: () => {
      setSelectedGroup({ name: '', members: [] });
      setSidePanelOpened(true);
    },
    handleSave: async (userGroup: ClientUserGroupSchema) => {
      if (!userGroup._id) {
        delete userGroup._id;
      }
      await saveGroup(userGroup);
      await loadAllUsers();
      closeSidePanel();
    },
    handleDelete: async (userGroup: ClientUserGroupSchema) => {
      await deleteGroup(userGroup);
      await loadAllUsers();
      closeSidePanel();
    },
  };

  return (
    <>
      <UserGroupList
        userGroups={groupList}
        handleSelect={handlers.handleSelect}
        handleAddGroup={handlers.handleAddGroup}
        className={sidePanelOpened ? 'with-sidepanel' : ''}
      />
      {selectedGroup && (
        <UserGroupSidePanel
          key={selectedGroup._id ? selectedGroup._id.toString() : ''}
          userGroup={selectedGroup}
          users={userList}
          userGroups={groupList}
          opened={sidePanelOpened}
          closePanel={closeSidePanel}
          onSave={handlers.handleSave}
          onDelete={handlers.handleDelete}
        />
      )}
    </>
  );
};

const mapStateToProps = (state: IStore & { users: IImmutable<GroupMemberSchema[]> }) => ({
  userGroups: state.userGroups,
  users: state.users,
});

const mapDispatchToProps = {
  loadUsers,
  loadUserGroups,
  saveUserGroup,
  deleteUserGroup,
};

export const UserGroups = connect(mapStateToProps, mapDispatchToProps)(UserGroupsComponent);
