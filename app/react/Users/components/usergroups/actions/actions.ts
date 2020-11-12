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
    dispatch(actions.push('userGroups', savedUserGroup));
  };
}
