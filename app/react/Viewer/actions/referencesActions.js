import * as types from 'app/Viewer/actions/actionTypes';
import refenrecesAPI from 'app/Viewer/referencesAPI';
import {notify} from 'app/Notifications';
import {actions} from 'app/BasicReducer';

import * as uiActions from './uiActions';
import {actions as connectionsActions} from 'app/Connections';

// export function setRelationType(relationType) {
//   return {
//     type: types.SET_RELATION_TYPE,
//     relationType
//   };
// }

export function setReferences(references) {
  return {
    type: types.SET_REFERENCES,
    references
  };
}
export function addReference(reference) {
  return function (dispatch) {
    const tab = reference.sourceRange.text ? 'references' : 'connections';
    dispatch({
      type: types.ADD_REFERENCE,
      reference: reference
    });
    dispatch(actions.unset('viewer/targetDoc'));
    dispatch(actions.unset('viewer/targetDocHTML'));
    dispatch(actions.unset('viewer/targetDocReferences'));
    dispatch(uiActions.activateReference(reference._id, tab));
  };
}

// TEST!!!
export function saveTargetRangedReference(connection, targetRange, onCreate) {
  return function (dispatch) {
    if (targetRange) {
      dispatch(actions.unset('viewer/targetDocReferences'));
      connection.targetRange = targetRange;
      return connectionsActions.saveConnection(connection, onCreate)(dispatch);
    }
  };
}
// ---

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
