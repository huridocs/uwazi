import * as types from 'app/Viewer/actions/actionTypes';
import refenrecesAPI from 'app/Viewer/referencesAPI';
import {notify} from 'app/Notifications';
import {actions} from 'app/BasicReducer';

import * as uiActions from './uiActions';
import {actions as connectionsActions} from 'app/Connections';

import {isClient} from 'app/utils';

import {store} from '../../store.js';
if (isClient) {
  window.uwazi = {};
  window.uwazi.moveConnection = (id, leftOffset, right) => {
    const rightOffset = right || leftOffset;
    let reference = store.getState().documentViewer.references.toJS().find((r) => r._id === id);
    let pdfInfo = store.getState().documentViewer.doc.get('pdfInfo').toJS();
    let movedRef = {
      _rev: reference._rev,
      _id: reference._id,
      sourceRange: reference.sourceRange,
      targetDocument: reference.targetDocument,
      targetRange: reference.targetRange,
      sourceDocument: reference.sourceDocument,
      relationType: reference.relationType,
      language: reference.language,
      type: reference.type
    };

    movedRef.sourceRange.start += leftOffset;
    movedRef.sourceRange.end += rightOffset;

    store.dispatch({
      type: types.REMOVE_REFERENCE,
      reference: movedRef
    });
    return connectionsActions.saveConnection(movedRef, (updatedReference) => {
      store.dispatch({
        type: types.ADD_REFERENCE,
        reference: updatedReference
      });
      store.dispatch(uiActions.activateReference(updatedReference, pdfInfo, 'references'));
    })(store.dispatch, store.getState);
  };
}


export function setReferences(references) {
  return {
    type: types.SET_REFERENCES,
    references
  };
}

export function addReference(reference, docInfo, delayActivation) {
  return function (dispatch) {
    const tab = reference.sourceRange.text ? 'references' : 'connections';
    dispatch({
      type: types.ADD_REFERENCE,
      reference: reference
    });
    dispatch(actions.unset('viewer/targetDoc'));
    dispatch(actions.unset('viewer/targetDocHTML'));
    dispatch(actions.unset('viewer/targetDocReferences'));
    if (delayActivation) {
      dispatch({type: types.ACTIVE_REFERENCE, reference: reference._id});
      dispatch(uiActions.goToActive());
      dispatch({type: types.OPEN_PANEL, panel: 'viewMetadataPanel'});
      dispatch(actions.set('viewer.sidepanel.tab', tab));
    } else {
      dispatch(uiActions.activateReference(reference, docInfo, tab));
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
