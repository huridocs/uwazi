import * as types from 'app/Viewer/actions/actionTypes';
import refenrecesAPI from 'app/Viewer/referencesAPI';
import {notify} from 'app/Notifications';
import {actions} from 'app/BasicReducer';
import * as uiActions from './uiActions';

export function setRelationType(relationType) {
  return {
    type: types.SET_RELATION_TYPE,
    relationType
  };
}

export function setReferences(references) {
  return {
    type: types.SET_REFERENCES,
    references
  };
}

export function saveReference(reference, tab) {
  return function (dispatch) {
    return refenrecesAPI.save(reference)
    .then((referenceCreated) => {
      dispatch({
        type: types.ADD_CREATED_REFERENCE,
        reference: referenceCreated
      });

      dispatch(actions.unset('viewer/targetDoc'));
      dispatch(actions.unset('viewer/targetDocHTML'));
      dispatch(actions.unset('viewer/targetDocReferences'));

      dispatch(uiActions.activateReference(referenceCreated._id, tab));
      dispatch(notify('saved successfully !', 'success'));
    });
  };
}

export function deleteReference(reference) {
  return function (dispatch) {
    return refenrecesAPI.delete(reference)
    .then(() => {
      dispatch({
        type: types.REMOVE_REFERENCE,
        reference
      });
      dispatch(notify('Connection deleted', 'success'));
    });
  };
}
