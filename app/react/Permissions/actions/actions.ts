import { Dispatch } from 'redux';
import { IStore } from 'app/istore';
import { notificationActions } from 'app/Notifications';
import { savePermissions } from 'app/Permissions/PermissionsAPI';
import { PermissionsDataSchema } from 'shared/types/permissionType';

export function saveEntitiesPermissions(permissionsData: PermissionsDataSchema) {
  return async (dispatch: Dispatch<IStore>) => {
    await savePermissions(permissionsData);
    dispatch(notificationActions.notify('Update success', 'success'));
  };
}
