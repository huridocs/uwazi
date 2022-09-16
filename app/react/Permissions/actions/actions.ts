/* eslint-disable max-statements */
import { Dispatch } from 'redux';
import { IStore } from 'app/istore';
import { notificationActions } from 'app/Notifications';
import { t } from 'app/I18N';
import { savePermissions } from 'app/Permissions/PermissionsAPI';
import { PermissionsDataSchema } from 'shared/types/permissionType';
import { wrapDispatch } from 'app/Multireducer';
import {
  REMOVE_DOCUMENTS_SHAREDIDS,
  UPDATE_DOCUMENTS_PUBLISHED,
} from 'app/Library/actions/actionTypes';
import { unselectAllDocuments } from 'app/Library/actions/libraryActions';
import { PermissionType, MixedAccess } from '../../../shared/types/permissionSchema';

export function saveEntitiesPermissions(permissionsData: PermissionsDataSchema, storeKey?: string) {
  return async (dispatch: Dispatch<IStore>, getState: () => IStore) => {
    const response = await savePermissions(permissionsData);
    const publicPermission = response.permissions.find(p => p.type === PermissionType.PUBLIC);
    const publicIsMixed = publicPermission?.level === MixedAccess.MIXED;

    if (storeKey && !publicIsMixed) {
      const { unpublished: showingUnpublished, includeUnpublished } =
        getState()[storeKey as 'library' | 'uploads'].search || {};

      const notShowingPublicAndPrivate = showingUnpublished || !includeUnpublished;
      const toMoveFromCollection = showingUnpublished === !!publicPermission;

      const wrappedDispatch = wrapDispatch(dispatch, storeKey);

      if (notShowingPublicAndPrivate) {
        if (toMoveFromCollection) {
          wrappedDispatch({
            type: REMOVE_DOCUMENTS_SHAREDIDS,
            sharedIds: permissionsData.ids,
          });

          wrappedDispatch(unselectAllDocuments());
        }
      } else {
        wrappedDispatch({
          type: UPDATE_DOCUMENTS_PUBLISHED,
          sharedIds: permissionsData.ids,
          published: !!publicPermission,
        });
      }
    }

    dispatch(notificationActions.notify(t('System', 'Update success', null, false), 'success'));
  };
}
