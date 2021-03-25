import { Dispatch } from 'redux';
import { IStore } from 'app/istore';
import { notificationActions } from 'app/Notifications';
import { savePermissions } from 'app/Permissions/PermissionsAPI';
import { PermissionsDataSchema } from 'shared/types/permissionType';
import { wrapDispatch } from 'app/Multireducer';
import { REMOVE_DOCUMENTS_SHAREDIDS } from 'app/Library/actions/actionTypes';

export function saveEntitiesPermissions(
  permissionsData: PermissionsDataSchema,
  storeKey: 'library' | 'uploads'
) {
  return async (dispatch: Dispatch<IStore>, getState: () => IStore) => {
    const response = await savePermissions(permissionsData);

    const newPublishingStatus = response.permissions.findIndex(p => p.type === 'public') >= 0;

    const { unpublished: showingUnpublished, includeUnpublished } = getState()[storeKey].search;

    const notShowingPublicAndPrivate = showingUnpublished || !includeUnpublished;
    const newStatusNotMatchingCurrentFilters = newPublishingStatus === showingUnpublished;

    if (newStatusNotMatchingCurrentFilters) {
      if (notShowingPublicAndPrivate) {
        wrapDispatch(
          dispatch,
          storeKey
        )({
          type: REMOVE_DOCUMENTS_SHAREDIDS,
          sharedIds: permissionsData.ids,
        });
      } else {
        // edit documents to set public/private
      }
    }

    dispatch(notificationActions.notify('Update success', 'success'));
  };
}
