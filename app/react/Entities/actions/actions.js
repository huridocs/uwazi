import api from '../EntitiesAPI';
import {notify} from 'app/Notifications';
import {actions as formActions} from 'react-redux-form';
import {actions} from 'app/BasicReducer';
import {removeDocument, removeDocuments, unselectDocument, unselectAllDocuments} from 'app/Library/actions/libraryActions';
import {actions as relationshipActions} from 'app/Relationships';

export function saveEntity(entity) {
  return function (dispatch) {
    return api.save(entity)
    .then((response) => {
      dispatch(notify('Entity saved', 'success'));
      dispatch(formActions.reset('entityView.entityForm'));
      dispatch(actions.set('entityView/entity', response));
      dispatch(relationshipActions.reloadRelationships(response.sharedId));
    });
  };
}

export function deleteEntity(entity) {
  return function (dispatch) {
    return api.delete(entity)
    .then(() => {
      dispatch(notify('Entity deleted', 'success'));
      dispatch(removeDocument(entity));
      dispatch(unselectDocument(entity._id));
    });
  };
}

export function deleteEntities(entities) {
  return function (dispatch) {
    return api.deleteMultiple(entities)
    .then(() => {
      dispatch(notify('Deletion success', 'success'));
      dispatch(unselectAllDocuments());
      dispatch(removeDocuments(entities));
    });
  };
}
