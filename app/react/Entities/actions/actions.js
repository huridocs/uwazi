import { getStore } from '#shared/atomStore/index.js';
import { actions } from '#app/BasicReducer/index.js';
import { EntitiesAPI as api } from '#app/Entities/EntitiesAPI.js';
import { t } from '#app/I18N/index.js';

import {
  removeDocument,
  removeDocuments,
  unselectAllDocuments,
  unselectDocument,
} from '#app/Library/actions/libraryActions.js';
import { saveEntityWithFiles } from '#app/Library/actions/saveEntityWithFiles.js';
import { notificationActions } from '#app/Notifications/index.js';
import { actions as relationshipActions } from '#app/Relationships/index.js';
import { RequestParams } from '#app/utils/RequestParams.js';
import { actions as formActions } from 'react-redux-form';
import { deletedEntityAtom } from '#V2/atoms/index.js';

export function saveEntity(entity) {
  return async dispatch => {
    const { entity: updatedDoc, errors } = await saveEntityWithFiles(entity, dispatch);
    if (!errors.length) {
      dispatch(notificationActions.notify(t('System', 'Entity saved', null, false), 'success'));
    } else {
      dispatch(
        notificationActions.notify(
          `Entity saved with the following errors: ${JSON.stringify(errors, null, 2)}`,
          'warning'
        )
      );
    }
    dispatch(formActions.reset('entityView.entityForm'));
    dispatch(actions.set('entityView/entity', updatedDoc));
    dispatch(relationshipActions.reloadRelationships(updatedDoc.sharedId));
  };
}

export function resetForm() {
  return dispatch => dispatch(formActions.reset('entityView.entityForm'));
}

export function deleteEntity(entity) {
  return async dispatch => {
    await api.delete(new RequestParams({ sharedId: entity.sharedId }));
    dispatch(notificationActions.notify(t('System', 'Entity deleted', null, false), 'success'));
    dispatch(removeDocument(entity));
    getStore().set(deletedEntityAtom, entity.sharedId);
    await dispatch(unselectDocument(entity._id));
  };
}

export function deleteEntities(entities) {
  return async dispatch => {
    await api.deleteMultiple(new RequestParams({ sharedIds: entities.map(e => e.sharedId) }));
    dispatch(notificationActions.notify(t('System', 'Deletion success', null, false), 'success'));
    await dispatch(unselectAllDocuments());
    dispatch(removeDocuments(entities));
  };
}
