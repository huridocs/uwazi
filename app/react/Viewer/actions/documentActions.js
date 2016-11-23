import api from 'app/utils/api';
import referencesAPI from 'app/Viewer/referencesAPI';
import * as types from 'app/Viewer/actions/actionTypes';
import * as connectionsTypes from 'app/Connections/actions/actionTypes';

import {APIURL} from 'app/config.js';
import {PDFUtils} from '../../PDF/';
import {actions} from 'app/BasicReducer';
import {actions as formActions} from 'react-redux-form';
import documents from 'app/Documents';
import {notify} from 'app/Notifications';
import {removeDocument, unselectDocument} from 'app/Library/actions/libraryActions';
import referencesUtils from '../utils/referencesUtils';
import * as selectionActions from './selectionActions';
import * as uiActions from './uiActions';
import {isClient} from 'app/utils';

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

export function getDocument(id) {
  return api.get('documents?_id=' + id)
  .then((response) => {
    let doc = response.json.rows[0];
    if (!isClient) {
      return doc;
    }
    if (doc.pdfInfo) {
      return doc;
    }
    return PDFUtils.extractPDFInfo(`${APIURL}documents/download?_id=${doc._id}`)
    .then((pdfInfo) => {
      doc.pdfInfo = pdfInfo;
      return api.post('documents/pdfInfo', doc)
      .then((res) => {
        return res.json;
      });
    });
  });
}

export function loadTargetDocument(id) {
  return function (dispatch, getState) {
    return Promise.all([
      getDocument(id),
      referencesAPI.get(id)
    ])
    .then(([targetDoc, references]) => {
      dispatch(actions.set('viewer/targetDoc', targetDoc));
      dispatch(actions.set('viewer/targetDocReferences', referencesUtils.filterRelevant(references, getState().locale)));
    });
  };
}

export function cancelTargetDocument() {
  return function (dispatch) {
    dispatch({type: connectionsTypes.CANCEL_RANGED_CONNECTION});
    dispatch(actions.unset('viewer/targetDoc'));
    dispatch(actions.unset('viewer/targetDocReferences'));
    dispatch(selectionActions.unsetTargetSelection());
    dispatch(uiActions.openPanel('viewMetadataPanel'));
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
