import { Dispatch } from 'redux';
import { IStore } from 'app/istore';
import { actions } from 'app/BasicReducer';
import { UserGroupSchema } from 'shared/types/userGroupType';
import { RequestParams } from 'app/utils/RequestParams';
import api from '../UserGroupsAPI';

export function loadUserGroups() {
  return async (dispatch: Dispatch<IStore>) => {
    const userGroups = await api.getUserGroups();
    dispatch(actions.set('userGroups', userGroups));
  };
}

export function saveUserGroup(userGroup: UserGroupSchema) {
  return async (dispatch: Dispatch<IStore>) => {
    const savedUserGroup = await api.saveUserGroup(new RequestParams(userGroup));
    const userGroupToDispatch = { ...savedUserGroup, members: userGroup.members };
    if (userGroup._id) {
      dispatch(actions.update('userGroups', userGroupToDispatch));
    } else {
      dispatch(actions.push('userGroups', userGroupToDispatch));
    }
  };
}
