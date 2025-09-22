import api from '../../RelationTypes/RelationTypesAPI.js';
import { actions as formActions } from 'react-redux-form';
import referencesAPI from '../../Viewer/referencesAPI.js';
import { actions } from '../../BasicReducer/index.js';
import { RequestParams } from '../../utils/RequestParams.js';

export function editRelationType(relationType) {
  return formActions.load('template.data', relationType);
}

export function deleteRelationType(relationType) {
  return function (dispatch) {
    return api.delete(new RequestParams({ _id: relationType._id })).then(() => {
      dispatch(actions.remove('relationTypes', relationType));
    });
  };
}

export function checkRelationTypeCanBeDeleted(relationType) {
  return function () {
    return referencesAPI
      .countByRelationType(new RequestParams({ relationtypeId: relationType._id }))
      .then(count => {
        if (count) {
          return Promise.reject();
        }
      });
  };
}
