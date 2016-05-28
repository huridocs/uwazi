import * as types from 'app/Viewer/actions/actionTypes';
import refenrecesAPI from 'app/Viewer/referencesAPI';
import {notify} from 'app/Notifications';

export function setReferences(references) {
  return {
    type: types.SET_REFERENCES,
    references
  };
}

export function saveReference(reference) {
  return function (dispatch) {
    return refenrecesAPI.save(reference)
    .then((referenceCreated) => {
      dispatch({
        type: types.ADD_CREATED_REFERENCE,
        reference: referenceCreated
      });

      dispatch(notify('saved successfully !', 'success'));
    });
  };
}
