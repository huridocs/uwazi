import * as types from 'app/Viewer/actions/actionTypes';
import api from 'app/utils/api';

import {viewerSearching} from 'app/Viewer/actions/uiActions';
import {actions} from 'app/BasicReducer';
import {actions as formActions} from 'react-redux-form';
import documents from 'app/Documents';
import {notify} from 'app/Notifications';
import {removeDocument, unselectDocument} from 'app/Library/actions/libraryActions';

export function setDocument(document, html) {
  return {
    type: types.SET_DOCUMENT,
    document,
    html
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

export function saveDocument(doc) {
  return function (dispatch) {
    return documents.api.save(doc)
    .then((updatedDoc) => {
      dispatch(notify('Document updated', 'success'));
      dispatch({type: types.VIEWER_UPDATE_DOCUMENT, doc});
      dispatch(formActions.reset('documentViewer.docForm'));
      dispatch(actions.set('viewer/doc', updatedDoc));
    });
  };
}

export function deleteDocument(doc) {
  return function (dispatch) {
    return documents.api.delete(doc)
    .then(() => {
      dispatch(notify('Document deleted', 'success'));
      dispatch(resetDocumentViewer());
      dispatch(removeDocument(doc));
      dispatch(unselectDocument());
    });
  };
}


export function loadTargetDocument(id) {
  return function (dispatch) {
    return Promise.all([
      api.get('documents?_id=' + id),
      api.get('documents/html?_id=' + id)
    ])
    .then(([docResponse, htmlResponse]) => {
      dispatch(actions.set('viewer/targetDoc', docResponse.json.rows[0]));
      dispatch(actions.set('viewer/targetDocHTML', htmlResponse.json));
    });
  };
}

export function viewerSearchDocuments(searchTerm) {
  return function (dispatch) {
    dispatch(viewerSearching());

    let search = {
      searchTerm,
      fields: ['doc.title']
    };

    return api.get('documents/search', search)
    .then((response) => {
      dispatch(actions.set('viewer/documentResults', response.json.rows));
    });
  };
}
