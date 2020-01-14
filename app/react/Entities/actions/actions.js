/** @format */

import { actions } from 'app/BasicReducer';
import api from 'app/Entities/EntitiesAPI';
import {
  removeDocument,
  removeDocuments,
  unselectAllDocuments,
  unselectDocument,
} from 'app/Library/actions/libraryActions';
import { notificationActions } from 'app/Notifications';
import { actions as relationshipActions } from 'app/Relationships';
import { RequestParams } from 'app/utils/RequestParams';
import { actions as formActions } from 'react-redux-form';

export function saveEntity(entity) {
  return dispatch =>
    api.save(new RequestParams(entity)).then(response => {
      dispatch(notificationActions.notify('Entity saved', 'success'));
      dispatch(formActions.reset('entityView.entityForm'));
      dispatch(actions.set('entityView/entity', response));
      dispatch(relationshipActions.reloadRelationships(response.sharedId));
    });
}

export function resetForm() {
  return dispatch => dispatch(formActions.reset('entityView.entityForm'));
}

export function deleteEntity(entity) {
  return dispatch =>
    api.delete(new RequestParams({ sharedId: entity.sharedId })).then(() => {
      dispatch(notificationActions.notify('Entity deleted', 'success'));
      dispatch(removeDocument(entity));
      dispatch(unselectDocument(entity._id));
    });
}

export function deleteEntities(entities) {
  return dispatch =>
    api.deleteMultiple(new RequestParams({ sharedIds: entities.map(e => e.sharedId) })).then(() => {
      dispatch(notificationActions.notify('Deletion success', 'success'));
      dispatch(unselectAllDocuments());
      dispatch(removeDocuments(entities));
    });
}
