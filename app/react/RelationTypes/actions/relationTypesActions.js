import * as types from 'app/RelationTypes/actions/actionTypes';
import api from 'app/RelationTypes/RelationTypesAPI';
import {actions as formActions} from 'react-redux-form';
import referencesAPI from 'app/Viewer/referencesAPI';
import {showModal} from 'app/Modals/actions/modalActions';

export function editRelationType(relationType) {
  return function (dispatch) {
    dispatch(formActions.load('relationType', relationType));
  };
}

export function setRelationTypes(relationTypes) {
  return {
    type: types.SET_RELATION_TYPES,
    relationTypes
  };
}

export function deleteRelationType(relationType) {
  return function (dispatch) {
    return api.delete(relationType).then(() => {
      dispatch({
        type: types.RELATION_TYPE_DELETED,
        id: relationType._id
      });
    });
  };
}

export function checkRelationTypeCanBeDeleted(relationType) {
  return function (dispatch) {
    return referencesAPI.countByRelationType(relationType._id)
    .then((count) => {
      if (count) {
        return dispatch(showModal('CantDeleteRelationType', count));
      }

      dispatch(showModal('DeleteRelationTypeConfirm', relationType));
    });
  };
}
