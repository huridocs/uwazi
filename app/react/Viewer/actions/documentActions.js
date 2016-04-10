import * as types from 'app/Viewer/actions/actionTypes';

export function setDocument(document) {
  return {
    type: types.SET_DOCUMENT,
    document
  };
}

export function resetDocumentViewer() {
  return {
    type: types.RESET_DOCUMENT_VIEWER
  };
}

export function loadDefaultViewerMenu() {
  return {
    type: types.LOAD_DEFAULT_VIEWER_MENU
  };
}
