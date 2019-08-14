import { actions as formActions } from 'react-redux-form';

import { actions } from 'app/BasicReducer';
import { notificationActions } from 'app/Notifications';
import { removeDocument, removeDocuments, unselectDocument, unselectAllDocuments } from 'app/Library/actions/libraryActions';
import { actions as relationshipActions } from 'app/Relationships';

import api from '../EntitiesAPI';

export function saveEntity(entity) {
  return dispatch => api.save(entity)
  .then((response) => {
    dispatch(notificationActions.notify('Entity saved', 'success'));
    dispatch(formActions.reset('entityView.entityForm'));
    dispatch(actions.set('entityView/entity', response));
    dispatch(relationshipActions.reloadRelationships(response.sharedId));
  });
}

export function deleteEntity(entity) {
  return dispatch => api.delete(entity)
  .then(() => {
    dispatch(notificationActions.notify('Entity deleted', 'success'));
    dispatch(removeDocument(entity));
    dispatch(unselectDocument(entity._id));
  });
}

export function deleteEntities(entities) {
  return dispatch => api.deleteMultiple(entities)
  .then(() => {
    dispatch(notificationActions.notify('Deletion success', 'success'));
    dispatch(unselectAllDocuments());
    dispatch(removeDocuments(entities));
  });
}
