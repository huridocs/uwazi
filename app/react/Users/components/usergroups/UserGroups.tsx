import { loadUserGroups as loadCourses } from 'app/Users/components/usergroups/actions/actions';
import { connect } from 'react-redux';
import React, { useEffect } from 'react';
import { UserGroupList } from 'app/Users/components/usergroups/UserGroupList';
import { IStore } from 'app/istore';
import { UserGroupSchema } from 'shared/types/userGroupType';
import { IImmutable } from 'shared/types/Immutable';

export interface UserGroupProps {
  userGroups: IImmutable<UserGroupSchema[]>;
  loadUserGroups: () => any;
}

function UserGroups({ userGroups, loadUserGroups }: UserGroupProps) {
  useEffect(() => {
    if (userGroups.size === 0) {
      loadUserGroups().then();
    }
  }, []);
  const list = userGroups.toJS();
  return <UserGroupList userGroups={list} />;
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
