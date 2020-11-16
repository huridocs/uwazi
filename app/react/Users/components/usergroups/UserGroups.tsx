import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { IImmutable } from 'shared/types/Immutable';
import { UserGroupSchema } from 'shared/types/userGroupType';
import { IStore } from 'app/istore';
import { loadUserGroups, saveUserGroup } from 'app/Users/components/usergroups/actions/actions';
import { UserGroupList } from 'app/Users/components/usergroups/UserGroupList';
import { UserGroupSidePanel } from './UserGroupSidePanel';

export interface UserGroupProps {
  userGroups: IImmutable<UserGroupSchema[]>;
  loadUserGroups: () => any;
  saveUserGroup: (userGroup: UserGroupSchema) => any;
}

function UserGroups({
  userGroups,
  loadUserGroups: loadGroups,
  saveUserGroup: saveGroup,
}: UserGroupProps) {
  const [sidePanelOpened, setSidePanelOpened] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<UserGroupSchema>();
  const list = userGroups ? userGroups.toJS() : [];

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
        userGroups={list}
        handleSelect={handleSelect}
        handleAddGroup={handleAddGroup}
      />
      {selectedGroup && (
        <UserGroupSidePanel
          userGroup={selectedGroup}
          opened={sidePanelOpened}
          closePanel={closeSidePanel}
          onSave={handleSave}
        />
      )}
    </>
  );
}

function mapStateToProps(state: IStore) {
  return {
    userGroups: state.userGroups,
  };
}

const mapDispatchToProps = {
  loadUserGroups,
  saveUserGroup,
};

export default connect(mapStateToProps, mapDispatchToProps)(UserGroups);
