import api from 'app/RelationTypes/RelationTypesAPI';
import {actions as formActions} from 'react-redux-form';
import referencesAPI from 'app/Viewer/referencesAPI';
import {actions} from 'app/BasicReducer';

export function editRelationType(relationType) {
  return function (dispatch) {
    dispatch(formActions.load('template.data', relationType));
  };
}

export function deleteRelationType(relationType) {
  return function (dispatch) {
    return api.delete(relationType).then(() => {
      dispatch(actions.remove('relationTypes', relationType));
    });
  };
}

export function checkRelationTypeCanBeDeleted(relationType) {
  return function () {
    return referencesAPI.countByRelationType(relationType._id)
    .then((count) => {
      if (count) {
        return Promise.reject();
      }
    });
  };
}
