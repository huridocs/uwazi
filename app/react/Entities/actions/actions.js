import { actions } from 'app/BasicReducer';
import api from 'app/Entities/EntitiesAPI';
import {
  removeDocument,
  removeDocuments,
  unselectAllDocuments,
  unselectDocument,
  saveEntityWithFiles,
} from 'app/Library/actions/libraryActions';
import { notificationActions } from 'app/Notifications';
import { actions as relationshipActions } from 'app/Relationships';
import { RequestParams } from 'app/utils/RequestParams';
import { actions as formActions } from 'react-redux-form';

export function saveEntity(entity) {
  return async dispatch => {
    const updatedDoc = await saveEntityWithFiles(entity);
    return api.save(new RequestParams(updatedDoc)).then(response => {
      dispatch(notificationActions.notify('Entity saved', 'success'));
      dispatch(formActions.reset('entityView.entityForm'));
      dispatch(actions.set('entityView/entity', response));
      dispatch(relationshipActions.reloadRelationships(response.sharedId));
    });
  };
}

export function resetForm() {
  return dispatch => dispatch(formActions.reset('entityView.entityForm'));
}

export function deleteEntity(entity) {
  return async dispatch => {
    await api.delete(new RequestParams({ sharedId: entity.sharedId }));
    dispatch(notificationActions.notify('Entity deleted', 'success'));
    dispatch(removeDocument(entity));
    await dispatch(unselectDocument(entity._id));
  };
}

export function deleteEntities(entities) {
  return async dispatch => {
    await api.deleteMultiple(new RequestParams({ sharedIds: entities.map(e => e.sharedId) }));
    dispatch(notificationActions.notify('Deletion success', 'success'));
    await dispatch(unselectAllDocuments());
    dispatch(removeDocuments(entities));
  };
}
