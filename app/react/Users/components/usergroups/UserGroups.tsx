import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { IImmutable } from 'shared/types/Immutable';
import { GroupMemberSchema, UserGroupSchema } from 'shared/types/userGroupType';
import { IStore } from 'app/istore';
import { loadUserGroups, saveUserGroup } from 'app/Users/components/usergroups/actions/actions';
import { UserGroupList } from 'app/Users/components/usergroups/UserGroupList';
import { UserGroupSidePanel } from './UserGroupSidePanel';

export interface UserGroupProps {
  userGroups: IImmutable<UserGroupSchema[]>;
  users: IImmutable<GroupMemberSchema[]>;
  loadUserGroups: () => any;
  saveUserGroup: (userGroup: UserGroupSchema) => any;
}

function UserGroups({
  userGroups,
  users,
  loadUserGroups: loadGroups,
  saveUserGroup: saveGroup,
}: UserGroupProps) {
  const [sidePanelOpened, setSidePanelOpened] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<UserGroupSchema>();
  const groupList = userGroups ? userGroups.toJS() : [];
  const userList = users ? users.toJS() : [];

  useEffect(() => {
    if (userGroups === undefined || userGroups.size === 0) {
      loadGroups().then();
    }
  }, []);

  function handleSelect(userGroup: UserGroupSchema) {
    setSelectedGroup(userGroup);
    setSidePanelOpened(true);
  }
  function handleAddGroup() {
    setSelectedGroup({ name: '', members: [] });
    setSidePanelOpened(true);
  }
  function closeSidePanel() {
    setSelectedGroup(undefined);
    setSidePanelOpened(false);
  }
  async function handleSave(userGroup: UserGroupSchema) {
    await saveGroup(userGroup);
    closeSidePanel();
  }
  return (
    <>
      <UserGroupList
        userGroups={groupList}
        handleSelect={handleSelect}
        handleAddGroup={handleAddGroup}
      />
      {selectedGroup && (
        <UserGroupSidePanel
          userGroup={selectedGroup}
          users={userList}
          opened={sidePanelOpened}
          closePanel={closeSidePanel}
          onSave={handleSave}
        />
      )}
    </>
  );
}

function mapStateToProps(state: IStore & { users: IImmutable<GroupMemberSchema[]> }) {
  return {
    userGroups: state.userGroups,
    users: state.users,
  };
}

const mapDispatchToProps = {
  loadUserGroups,
  saveUserGroup,
};

export default connect(mapStateToProps, mapDispatchToProps)(UserGroups);
