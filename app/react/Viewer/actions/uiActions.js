import * as types from 'app/Viewer/actions/actionTypes';

export function openReferencePanel(panelType = '') {
  return {
    type: types.OPEN_REFERENCE_PANEL,
    panelType
  };
}

export function viewerSearching() {
  return {
    type: types.VIEWER_SEARCHING
  };
}

export function selectTargetDocument(id) {
  return {
    type: types.SELECT_TARGET_DOCUMENT,
    id
  };
}
