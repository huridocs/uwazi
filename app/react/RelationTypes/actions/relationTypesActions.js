import * as types from 'app/RelationTypes/actions/actionTypes';
import api from 'app/RelationTypes/RelationTypesAPI';

export function editRelationType(relationType) {
  return {
    type: types.EDIT_RELATION_TYPE,
    relationType
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
