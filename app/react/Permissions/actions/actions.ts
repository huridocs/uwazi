import { Dispatch } from 'redux';
import { IStore } from 'app/istore';
import { notificationActions } from 'app/Notifications';
import { savePermissions } from 'app/Permissions/PermissionsAPI';
import { PermissionsDataSchema } from 'shared/types/permissionType';
import { wrapDispatch } from 'app/Multireducer';
import { REMOVE_DOCUMENTS_SHAREDIDS } from 'app/Library/actions/actionTypes';

export function saveEntitiesPermissions(permissionsData: PermissionsDataSchema, storeKey: string) {
  return async (dispatch: Dispatch<IStore>) => {
    await savePermissions(permissionsData);
    wrapDispatch(
      dispatch,
      storeKey
    )({
      type: REMOVE_DOCUMENTS_SHAREDIDS,
      sharedIds: permissionsData.ids,
    });
    dispatch(notificationActions.notify('Update success', 'success'));
  };
}
