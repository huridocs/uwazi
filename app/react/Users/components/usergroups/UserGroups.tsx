import { loadUserGroups as loadCourses } from 'app/Users/components/usergroups/actions/actions';
import { connect } from 'react-redux';
import React, { useEffect, useState } from 'react';
import { UserGroupList } from 'app/Users/components/usergroups/UserGroupList';
import { IStore } from 'app/istore';
import { UserGroupSchema } from 'shared/types/userGroupType';
import { IImmutable } from 'shared/types/Immutable';
import { UserGroupSidePanel } from './UserGroupSidePanel';

export interface UserGroupProps {
  userGroups: IImmutable<UserGroupSchema[]>;
  loadUserGroups: () => any;
}

function UserGroups({ userGroups, loadUserGroups }: UserGroupProps) {
  const [sidePanelOpened, setSidePanelOpened] = useState(false);

  useEffect(() => {
    if (userGroups.size === 0) {
      loadUserGroups().then();
    }
  }, []);
  const list = userGroups.toJS();
  function handleSelect() {
    setSidePanelOpened(true);
  }
  function closeSidePanel() {
    setSidePanelOpened(false);
  }
  function handleSave(event: { preventDefault: () => void }) {
    event.preventDefault();
  }
  return (
    <>
      <UserGroupList userGroups={list} handleSelect={handleSelect} />
      <UserGroupSidePanel
        userGroup={(list && list[0]) || {}}
        opened={sidePanelOpened}
        closePanel={closeSidePanel}
        onSave={handleSave}
      />
    </>
  );
}

function mapStateToProps(state: IStore) {
  return {
    userGroups: state.userGroups,
  };
}

const mapDispatchToProps = {
  loadUserGroups: loadCourses,
};

export default connect(mapStateToProps, mapDispatchToProps)(UserGroups);
