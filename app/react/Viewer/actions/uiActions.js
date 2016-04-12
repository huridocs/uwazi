import * as types from 'app/Viewer/actions/actionTypes';

export function openReferencePanel() {
  return {
    type: types.OPEN_REFERENCE_PANEL
  };
}

export function viewerSearching() {
  return {
    type: types.VIEWER_SEARCHING
  };
}
