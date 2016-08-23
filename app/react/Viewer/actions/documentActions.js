import * as types from 'app/Viewer/actions/actionTypes';
import api from 'app/utils/api';
import referencesAPI from 'app/Viewer/referencesAPI';

import {viewerSearching} from 'app/Viewer/actions/uiActions';
import {actions} from 'app/BasicReducer';
import {actions as formActions} from 'react-redux-form';
import documents from 'app/Documents';
import {notify} from 'app/Notifications';
import {removeDocument, unselectDocument} from 'app/Library/actions/libraryActions';
import * as uiActions from './uiActions';

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

export function saveToc(toc) {
  return function (dispatch, getState) {
    let doc = getState().documentViewer.doc.toJS();
    doc.toc = toc;
    dispatch(formActions.reset('documentViewer.tocForm'));
    dispatch(actions.set('documentViewer/tocBeingEdited', false));
    return dispatch(saveDocument(doc));
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
      api.get('documents/html?_id=' + id),
      referencesAPI.get(id)
    ])
    .then(([docResponse, htmlResponse, references]) => {
      dispatch(actions.set('viewer/targetDoc', docResponse.json.rows[0]));
      dispatch(actions.set('viewer/targetDocHTML', htmlResponse.json));
      dispatch(actions.set('viewer/targetDocReferences', references));
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

    return api.get('search', search)
    .then((response) => {
      dispatch(actions.set('viewer/documentResults', response.json.rows));
    });
  };
}

export function editToc(toc) {
  return function (dispatch) {
    dispatch(actions.set('documentViewer/tocBeingEdited', true));
    dispatch(formActions.load('documentViewer.tocForm', toc));
    dispatch(uiActions.openPanel('viewMetadataPanel'));
    dispatch(uiActions.showTab('toc'));
  };
}

export function removeFromToc(tocElement) {
  return function (dispatch, getState) {
    let state = getState();
    let toc = state.documentViewer.tocForm;

    toc = toc.filter((entry) => {
      return entry !== tocElement;
    });

    dispatch(formActions.load('documentViewer.tocForm', toc));
  };
}

export function indentTocElement(tocElement, indentation) {
  return function (dispatch, getState) {
    let state = getState();
    let toc = state.documentViewer.tocForm.concat();

    toc.forEach((entry) => {
      if (entry === tocElement) {
        entry.indentation = indentation;
      }
    });

    dispatch(formActions.load('documentViewer.tocForm', toc));
  };
}

export function addToToc(textSelectedObject) {
  return function (dispatch, getState) {
    let state = getState();
    let toc = state.documentViewer.tocForm;
    if (!toc.length) {
      toc = state.documentViewer.doc.toJS().toc || [];
    }

    let tocElement = {
      range: {
        start: textSelectedObject.sourceRange.start,
        end: textSelectedObject.sourceRange.end
      },
      label: textSelectedObject.sourceRange.text,
      indentation: 0
    };

    toc.push(tocElement);
    toc = toc.sort((a, b) => {
      return a.range.start - b.range.start;
    });
    dispatch(editToc(toc));
  };
}
