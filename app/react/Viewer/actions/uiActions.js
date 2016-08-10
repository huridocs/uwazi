import * as types from 'app/Viewer/actions/actionTypes';
import {actions} from 'app/BasicReducer';
import scroller from 'app/Viewer/utils/Scroller';
import {setTargetSelection} from 'app/Viewer/actions/selectionActions';

export function closePanel() {
  return {
    type: types.CLOSE_PANEL
  };
}

export function openPanel(panel) {
  return {
    type: types.OPEN_PANEL,
    panel
  };
}

export function viewerSearching() {
  return {
    type: types.VIEWER_SEARCHING
  };
}

export function resetReferenceCreation() {
  return function (dispatch) {
    dispatch({type: types.RESET_REFERENCE_CREATION});
    dispatch(actions.unset('viewer/targetDoc'));
    dispatch(actions.unset('viewer/targetDocHTML'));
    dispatch(actions.unset('viewer/targetDocReferences'));
  };
}

export function selectTargetDocument(id) {
  return {
    type: types.SELECT_TARGET_DOCUMENT,
    id
  };
}

export function highlightReference(reference) {
  return {
    type: types.HIGHLIGHT_REFERENCE,
    reference
  };
}

export function deactivateReference() {
  return {
    type: types.DEACTIVATE_REFERENCE
  };
}

export function activateReference(reference) {
  scroller.to(`.document-viewer a[data-id="${reference}"]`, '.document-viewer');
  scroller.to(`.document-references .item[data-id="${reference}"]`, '.document-references');
  return function (dispatch) {
    dispatch({type: types.ACTIVE_REFERENCE, reference});
    dispatch({type: types.OPEN_PANEL, panel: 'viewReferencesPanel'});
  };
}

export function selectReference(referenceId, references) {
  let reference = references.find(item => item._id === referenceId);

  return function (dispatch) {
    dispatch(activateReference(referenceId));
    dispatch(setTargetSelection(reference.range));
  };
}
