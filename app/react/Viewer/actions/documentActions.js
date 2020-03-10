import api from 'app/utils/api';
import referencesAPI from 'app/Viewer/referencesAPI';
import * as types from 'app/Viewer/actions/actionTypes';
import * as connectionsTypes from 'app/Connections/actions/actionTypes';
import { entityDefaultDocument } from 'shared/entityDefaultDocument';

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
      dispatch(actions.update('viewer/doc', updatedDoc));
      dispatch(relationshipActions.reloadRelationships(updatedDoc.sharedId));
    });
}

export function saveToc(toc, fileId) {
  return async (dispatch, getState) => {
    const currentDoc = getState().documentViewer.doc.toJS();
    dispatch(formActions.reset('documentViewer.sidepanel.metadata'));
    dispatch(actions.set('documentViewer/tocBeingEdited', false));

    const updatedFile = (await api.post('files', new RequestParams({ toc, _id: fileId }))).json;
    const doc = {
      ...currentDoc,
      defaultDoc: updatedFile,
      documents: currentDoc.documents.map(d => {
        if (d._id === updatedFile._id) {
          return updatedFile;
        }
        return d;
      }),
    };

    dispatch(notificationActions.notify('Document updated', 'success'));
    dispatch({ type: types.VIEWER_UPDATE_DOCUMENT, doc });
    dispatch(formActions.reset('documentViewer.sidepanel.metadata'));
    dispatch(actions.set('viewer/doc', doc));
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

export async function getDocument(requestParams, defaultLanguage, filename) {
  const [entity] = (await api.get('entities', requestParams)).json.rows;

  const defaultDoc = filename
    ? entity.documents.find(d => d.filename === filename)
    : entityDefaultDocument(entity.documents, entity.language, defaultLanguage);

  entity.defaultDoc = defaultDoc;
  if (!isClient) {
    return entity;
  }
  if (defaultDoc.pdfInfo) {
    return entity;
  }

  const pdfInfo = await PDFUtils.extractPDFInfo(`${APIURL}files/${defaultDoc.filename}`);
  const processedDoc = await api
    .post('documents/pdfInfo', new RequestParams({ _id: defaultDoc._id, pdfInfo }))
    .then(res => res.json);

  return {
    ...entity,
    defaultDoc: processedDoc,
    documents: entity.documents.map(d => {
      if (d._id === processedDoc._id) {
        return processedDoc;
      }
      return d;
    }),
  };
}

export function loadTargetDocument(sharedId) {
  return (dispatch, getState) =>
    Promise.all([
      getDocument(new RequestParams({ sharedId }), getState().locale),
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

export function addToToc(textSelectedObject, currentToc) {
  return (dispatch, getState) => {
    const state = getState();
    let toc = state.documentViewer.tocForm.concat();
    if (!toc.length) {
      toc = currentToc;
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
