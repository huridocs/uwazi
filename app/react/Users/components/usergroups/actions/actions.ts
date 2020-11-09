import { Dispatch } from 'redux';
import { IStore } from 'app/istore';
import { actions } from 'app/BasicReducer';
import api from '../UserGroupsAPI';

export function loadUserGroups() {
  return async (dispatch: Dispatch<IStore>) => {
    const userGroups = await api.getUserGroups();
    dispatch(actions.set('userGroups', userGroups));
  };
}
