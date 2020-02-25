import api from 'app/utils/api';
import referencesAPI from 'app/Viewer/referencesAPI';
import * as types from 'app/Viewer/actions/actionTypes';
import * as connectionsTypes from 'app/Connections/actions/actionTypes';

import { APIURL } from 'app/config.js';
import { actions } from 'app/BasicReducer';
import { actions as formActions } from 'react-redux-form';
import { documentsApi } from 'app/Documents';
import { notificationActions } from 'app/Notifications';
import { removeDocument, unselectAllDocuments } from 'app/Library/actions/libraryActions';
import { isClient } from 'app/utils';
import { actions as relationshipActions } from 'app/Relationships';
import { RequestParams } from 'app/utils/RequestParams';
import * as selectionActions from './selectionActions';
import * as uiActions from './uiActions';
import { PDFUtils } from '../../PDF';

export function setDocument(document, html) {
  return {
    type: types.SET_DOCUMENT,
    document,
    html,
  };
}

export function resetDocumentViewer() {
  return {
    type: types.RESET_DOCUMENT_VIEWER,
  };
}

export function loadDefaultViewerMenu() {
  return {
    type: types.LOAD_DEFAULT_VIEWER_MENU,
  };
}

export function saveDocument(doc) {
  const updateDoc = {};
  Object.keys(doc).forEach(key => {
    if (key !== 'fullText') {
      updateDoc[key] = doc[key];
    }
  });

  return dispatch =>
    documentsApi.save(new RequestParams(updateDoc)).then(updatedDoc => {
      dispatch(notificationActions.notify('Document updated', 'success'));
      dispatch({ type: types.VIEWER_UPDATE_DOCUMENT, doc });
      dispatch(formActions.reset('documentViewer.sidepanel.metadata'));
      dispatch(actions.set('viewer/doc', updatedDoc));
      dispatch(relationshipActions.reloadRelationships(updatedDoc.sharedId));
    });
}

export function saveToc(toc) {
  return (dispatch, getState) => {
    const { _id, _rev, sharedId, file } = getState().documentViewer.doc.toJS();
    dispatch(formActions.reset('documentViewer.sidepanel.metadata'));
    dispatch(actions.set('documentViewer/tocBeingEdited', false));
    return dispatch(saveDocument({ _id, _rev, sharedId, toc, file }));
  };
}

export function deleteDocument(doc) {
  return dispatch =>
    documentsApi.delete(new RequestParams({ sharedId: doc.sharedId })).then(() => {
      dispatch(notificationActions.notify('Document deleted', 'success'));
      dispatch(resetDocumentViewer());
      dispatch(removeDocument(doc));
      dispatch(unselectAllDocuments());
    });
}

export function getDocument(requestParams) {
  return api.get('entities', requestParams).then(response => {
    const doc = response.json.rows[0];
    if (!isClient) {
      return doc;
    }
    if (doc.pdfInfo || !doc.file) {
      return doc;
    }
    return PDFUtils.extractPDFInfo(`${APIURL}documents/download?_id=${doc._id}`).then(pdfInfo => {
      const { _id, sharedId } = doc;
      return api
        .post('documents/pdfInfo', new RequestParams({ _id, sharedId, pdfInfo }))
        .then(res => res.json);
    });
  });
}

export function loadTargetDocument(sharedId) {
  return dispatch =>
    Promise.all([
      getDocument(new RequestParams({ sharedId })),
      referencesAPI.get(new RequestParams({ sharedId })),
    ]).then(([targetDoc, references]) => {
      dispatch(actions.set('viewer/targetDoc', targetDoc));
      dispatch(actions.set('viewer/targetDocReferences', references));
    });
}

export function cancelTargetDocument() {
  return dispatch => {
    dispatch({ type: connectionsTypes.CANCEL_RANGED_CONNECTION });
    dispatch(actions.unset('viewer/targetDoc'));
    dispatch(actions.unset('viewer/targetDocReferences'));
    dispatch(selectionActions.unsetTargetSelection());
    dispatch(uiActions.openPanel('viewMetadataPanel'));
  };
}

export function editToc(toc) {
  return dispatch => {
    dispatch(actions.set('documentViewer/tocBeingEdited', true));
    dispatch(formActions.load('documentViewer.tocForm', toc));
    dispatch(uiActions.openPanel('viewMetadataPanel'));
    dispatch(actions.set('viewer.sidepanel.tab', 'toc'));
  };
}

export function removeFromToc(tocElement) {
  return (dispatch, getState) => {
    const state = getState();
    let toc = state.documentViewer.tocForm;

    toc = toc.filter(entry => entry !== tocElement);

    dispatch(formActions.load('documentViewer.tocForm', toc));
  };
}

export function indentTocElement(tocElement, indentation) {
  return (dispatch, getState) => {
    const state = getState();
    const toc = state.documentViewer.tocForm.map(_entry => {
      const entry = Object.assign({}, _entry);
      if (_entry === tocElement) {
        entry.indentation = indentation;
      }
      return entry;
    });

    dispatch(formActions.load('documentViewer.tocForm', toc));
  };
}

export function addToToc(textSelectedObject) {
  return (dispatch, getState) => {
    const state = getState();
    let toc = state.documentViewer.tocForm.concat();
    if (!toc.length) {
      toc = state.documentViewer.doc.toJS().toc || [];
    }
    const tocElement = {
      range: {
        start: textSelectedObject.sourceRange.start,
        end: textSelectedObject.sourceRange.end,
      },
      label: textSelectedObject.sourceRange.text,
      indentation: 0,
    };

    toc.push(tocElement);
    toc = toc.sort((a, b) => a.range.start - b.range.start);
    dispatch(editToc(toc));
  };
}
