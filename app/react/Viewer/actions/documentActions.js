import * as types from 'app/Viewer/actions/actionTypes';
import api from 'app/utils/singleton_api';
import {viewerSearching} from 'app/Viewer/actions/uiActions';

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

export function viewerSearchDocuments(searchTerm) {
  return function (dispatch) {
    dispatch(viewerSearching());

    return api.get('documents/search?searchTerm=' + searchTerm)
    .then((response) => {
      dispatch({
        type: types.SET_VIEWER_RESULTS,
        results: response.json
      });
    });
  };
}
