import Immutable from 'immutable';

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
    .then((response) => {
      dispatch({
        type: types.ADD_CREATED_REFERENCE,
        reference: Immutable.fromJS(reference).set('_id', response.id).toJS()
      });

      dispatch(notify('saved successfully !', 'success'));
    });
  };
}
