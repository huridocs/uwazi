import { Dispatch } from 'redux';
import { ClientUserGroupSchema } from 'app/apiResponseTypes';
import { t } from 'app/I18N';
import { IStore } from 'app/istore';
import { actions } from 'app/BasicReducer';
import { RequestParams } from 'app/utils/RequestParams';
import { notificationActions } from 'app/Notifications';
import { ensure } from 'shared/tsUtils';
import { deleteGroup, getGroups, saveGroup } from 'app/Users/components/usergroups/UserGroupsAPI';

export function loadUserGroups() {
  return async (dispatch: Dispatch<IStore>) => {
    const userGroups = await getGroups(new RequestParams());
    dispatch(actions.set('userGroups', userGroups));
  };
}

export function saveUserGroup(userGroup: ClientUserGroupSchema) {
  return async (dispatch: Dispatch<IStore>) => {
    const savedUserGroup = await saveGroup(new RequestParams(userGroup));
    const userGroupToDispatch = { ...savedUserGroup, members: userGroup.members };
    if (userGroup._id) {
      dispatch(actions.update('userGroups', userGroupToDispatch));
      dispatch(notificationActions.notify(t('System', 'Group updated', null, false), 'success'));
    } else {
      dispatch(actions.push('userGroups', userGroupToDispatch));
      dispatch(notificationActions.notify(t('System', 'Group created', null, false), 'success'));
    }
  };
}

export function deleteUserGroup(userGroup: ClientUserGroupSchema) {
  return async (dispatch: Dispatch<IStore>) => {
    await deleteGroup(new RequestParams({ ids: [ensure(userGroup._id)] }));
    dispatch(actions.remove('userGroups', userGroup));
    dispatch(notificationActions.notify(t('System', 'Group deleted', null, false), 'success'));
  };
}
