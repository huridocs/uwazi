import * as types from 'app/Viewer/actions/actionTypes';
import referencesAPI from 'app/Viewer/referencesAPI';
import {notify} from 'app/Notifications';
import {actions} from 'app/BasicReducer';

import * as uiActions from './uiActions';
import {actions as connectionsActions} from 'app/Connections';
import {reloadRelationships} from 'app/Relationships/actions/actions';

export function setReferences(references) {
  return {
    type: types.SET_REFERENCES,
    references
  };
}

export function loadReferences(documentId) {
  return function (dispatch) {
    return referencesAPI.get(documentId)
    .then(references => {
      dispatch(setReferences(references));
    });
  };
}

export function addReference(references, docInfo, delayActivation) {
  return function (dispatch, getState) {
    const tab = 'references';

    dispatch({type: types.ADD_REFERENCE, reference: references[0][1]});
    dispatch({type: types.ADD_REFERENCE, reference: references[0][0]});

    dispatch(actions.unset('viewer/targetDoc'));
    dispatch(actions.unset('viewer/targetDocHTML'));
    dispatch(actions.unset('viewer/targetDocReferences'));
    dispatch(reloadRelationships(getState().relationships.list.entityId));

    if (delayActivation) {
      dispatch({type: types.ACTIVE_REFERENCE, reference: references[0][0]._id});
      dispatch(uiActions.goToActive());
      dispatch({type: types.OPEN_PANEL, panel: 'viewMetadataPanel'});
      dispatch(actions.set('viewer.sidepanel.tab', tab));
    } else {
      dispatch(uiActions.activateReference(references[0][0], docInfo, tab));
    }
  };
}

export function saveTargetRangedReference(connection, targetRange, onCreate) {
  return function (dispatch, getState) {
    if (targetRange.text) {
      dispatch(actions.unset('viewer/targetDocReferences'));
      connection.targetRange = targetRange;
      return connectionsActions.saveConnection(connection, onCreate)(dispatch, getState);
    }
  };
}

export function deleteReference(reference) {
  return function (dispatch, getState) {
    return referencesAPI.delete(reference.associatedRelationship)
    .then(() => {
      dispatch(reloadRelationships(getState().relationships.list.entityId));
      dispatch({type: types.REMOVE_REFERENCE, reference});
      dispatch(notify('Connection deleted', 'success'));
    });
  };
}
