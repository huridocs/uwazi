import { Dispatch } from 'redux';
import { UserGroupSchema } from 'shared/types/userGroupType';
import { IStore } from 'app/istore';
import { actions } from 'app/BasicReducer';
import { RequestParams } from 'app/utils/RequestParams';
import { notificationActions } from 'app/Notifications';
import { ensure } from 'shared/tsUtils';
import api from '../UserGroupsAPI';

export function loadUserGroups() {
  return async (dispatch: Dispatch<IStore>) => {
    const userGroups = await api.getUserGroups(new RequestParams());
    dispatch(actions.set('userGroups', userGroups));
  };
}

export function saveUserGroup(userGroup: UserGroupSchema) {
  return async (dispatch: Dispatch<IStore>) => {
    api
      .saveUserGroup(new RequestParams(userGroup))
      .then(savedUserGroup => {
        const userGroupToDispatch = { ...savedUserGroup, members: userGroup.members };
        if (userGroup._id) {
          dispatch(actions.update('userGroups', userGroupToDispatch));
          dispatch(notificationActions.notify('Group updated', 'success'));
        } else {
          dispatch(actions.push('userGroups', userGroupToDispatch));
          dispatch(notificationActions.notify('Group created', 'success'));
        }
      })
      .catch(() => dispatch(notificationActions.notify('Could not save the User Group', 'danger')));
  };
}

export function deleteUserGroup(userGroup: UserGroupSchema) {
  return async (dispatch: Dispatch<IStore>) => {
    await api.deleteUserGroup(new RequestParams({ _id: ensure(userGroup._id) }));
    dispatch(actions.remove('userGroups', userGroup));
    dispatch(notificationActions.notify('Group deleted', 'success'));
  };
}
