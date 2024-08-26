import * as types from 'app/Viewer/actions/actionTypes';
import referencesAPI from 'app/Viewer/referencesAPI';
import { notificationActions } from 'app/Notifications';
import { actions } from 'app/BasicReducer';
import { RequestParams } from 'app/utils/RequestParams';

import { actions as connectionsActions } from 'app/Connections';
import { reloadRelationships } from 'app/Relationships/actions/actions';
import * as uiActions from './uiActions';

export function setReferences(references) {
  return {
    type: types.SET_REFERENCES,
    references,
  };
}

export function loadReferences(sharedId) {
  return dispatch =>
    referencesAPI.get(new RequestParams({ sharedId })).then(references => {
      dispatch(setReferences(references));
    });
}

export function addReference(references, delayActivation) {
  return (dispatch, getState) => {
    const tab = 'references';

    dispatch({ type: types.ADD_REFERENCE, reference: references.saves[1] });
    dispatch({ type: types.ADD_REFERENCE, reference: references.saves[0] });

    dispatch(actions.unset('viewer/targetDoc'));
    dispatch(actions.unset('viewer/targetDocHTML'));
    dispatch(actions.unset('viewer/targetDocReferences'));
    dispatch(reloadRelationships(getState().relationships.list.sharedId));

    dispatch(uiActions.activateReference(references.saves[0], undefined, tab, delayActivation));
  };
}

export function saveTargetRangedReference(connection, targetRange, targetFile, onCreate) {
  return (dispatch, getState) => {
    if (targetRange.text) {
      dispatch(actions.unset('viewer/targetDocReferences'));
      return connectionsActions.saveConnection(
        { ...connection, targetRange, targetFile },
        onCreate
      )(dispatch, getState);
    }
    return undefined;
  };
}

export function deleteReference(reference) {
  const { _id } = reference.associatedRelationship;
  return (dispatch, getState) =>
    referencesAPI.delete(new RequestParams({ _id })).then(() => {
      dispatch(reloadRelationships(getState().relationships.list.sharedId));
      dispatch({ type: types.REMOVE_REFERENCE, reference });
      dispatch(notificationActions.notify('Connection deleted', 'success'));
    });
}
