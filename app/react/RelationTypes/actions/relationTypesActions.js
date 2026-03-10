import api from 'app/RelationTypes/RelationTypesAPI';
import { actions as formActions } from 'react-redux-form';
import referencesAPI from 'app/Viewer/referencesAPI';
import { actions } from 'app/BasicReducer';
import { RequestParams } from 'app/utils/RequestParams';

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
