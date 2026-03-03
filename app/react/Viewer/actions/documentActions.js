import omit from 'lodash/omit.js';
import { api } from '#app/utils/api.js';
import { ReferencesAPI as referencesAPI } from '#app/Viewer/referencesAPI.js';
import * as types from '#app/Viewer/actions/actionTypes.js';
import * as connectionsTypes from '#app/Connections/actions/actionTypes.js';
import { entityDefaultDocument } from '#shared/entityDefaultDocument.js';
import { actions } from '#app/BasicReducer/index.js';
import { actions as formActions } from 'react-redux-form';
import { getStore } from '#shared/atomStore/index.js';
import { documentsAPI } from '#app/Documents/index.js';
import { notificationActions } from '#app/Notifications/index.js';
import { removeDocument, unselectAllDocuments } from '#app/Library/actions/libraryActions.js';
import { actions as relationshipActions } from '#app/Relationships/index.js';
import { RequestParams } from '#app/utils/RequestParams.js';
import { closePanel as closeConnectionPanel } from '#app/Connections/actions/uiActions.js';
import { deletedEntityAtom } from '#V2/atoms/index.js';
import { saveEntityWithFiles } from '../../Library/actions/saveEntityWithFiles.js';
import * as selectionActions from './selectionActions.js';
import * as uiActions from './uiActions.js';
import { sortTextSelections } from '../utils/sortTextSelections.js';
import { EntitiesAPI as EntitiesApi } from '../../Entities/EntitiesAPI.js';

function getEntityDoc(entity, filename, defaultLanguage) {
  let docByFilename = entity.documents.find(d => d.filename === filename);
  docByFilename = docByFilename !== undefined ? docByFilename : {};

  const defaultDoc = entityDefaultDocument(entity.documents, entity.language, defaultLanguage);

  return filename ? docByFilename : defaultDoc;
}

const dispatchUpdatedDocument = (dispatch, doc, updatedDoc, entityFileId) => {
  dispatch(notificationActions.notify('Document updated', 'success'));
  dispatch({ type: types.VIEWER_UPDATE_DOCUMENT, doc });
  dispatch(formActions.reset('documentViewer.sidepanel.metadata'));
  const defaultDoc = updatedDoc.entity.documents.find(document => document._id === entityFileId);
  dispatch(actions.update('viewer/doc', { ...updatedDoc.entity, defaultDoc }));
  dispatch(relationshipActions.reloadRelationships(updatedDoc.entity.sharedId));
};

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
export function saveDocument(doc, fileID) {
  const updateDoc = omit(doc, 'fullText', 'defaultDoc');
  return async (dispatch, getState) => {
    const extractredMetadata = getState().documentViewer.metadataExtraction.toJS();
    const entityFileId = fileID || getState().documentViewer.doc.toJS().defaultDoc._id;
    updateDoc.__extractedMetadata = { fileID: entityFileId, ...extractredMetadata };
    const updatedDoc = await saveEntityWithFiles(updateDoc, dispatch);

    dispatchUpdatedDocument(dispatch, doc, updatedDoc, entityFileId);
    return updateDoc;
  };
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
  return async dispatch => {
    await documentsAPI.delete(new RequestParams({ sharedId: doc.sharedId }));
    dispatch(notificationActions.notify('Document deleted', 'success'));
    dispatch(resetDocumentViewer());
    dispatch(removeDocument(doc));
    getStore().set(deletedEntityAtom, doc.sharedId);
    await dispatch(unselectAllDocuments());
  };
}

export async function getDocument(requestParams, defaultLanguage, filename) {
  const [entity] = await EntitiesApi.get(requestParams.add({ omitRelationships: true }));

  entity.defaultDoc = getEntityDoc(entity, filename, defaultLanguage);
  return entity;
}

export function loadTargetDocument(sharedId) {
  return (dispatch, getState) => {
    if (!sharedId) {
      return Promise.resolve();
    }
    return getDocument(new RequestParams({ sharedId }), getState().locale).then(entity => {
      if (!entity) {
        return undefined;
      }
      dispatch(actions.set('viewer/targetDoc', entity));
      return referencesAPI
        .get(new RequestParams({ sharedId, file: entity.defaultDoc._id, onlyTextReferences: true }))
        .then(references => {
          dispatch(actions.set('viewer/targetDocReferences', references));
        });
    });
  };
}

export function reloadDocument(sharedId) {
  return (dispatch, getState) =>
    Promise.all([
      getDocument(new RequestParams({ sharedId }), getState().locale),
      referencesAPI.get(new RequestParams({ sharedId })),
    ]).then(([targetDoc, references]) => {
      dispatch(actions.set('viewer/doc', targetDoc));
      dispatch(actions.set('viewer/references', references));
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
    dispatch(closeConnectionPanel());
    dispatch(actions.set('documentViewer/tocBeingEdited', true));
    dispatch(formActions.load('documentViewer.tocForm', toc));
    dispatch(uiActions.openPanel('viewMetadataPanel'));
    dispatch(actions.set('viewer.sidepanel.tab', 'toc'));
  };
}

export function leaveEditMode() {
  return dispatch => {
    dispatch(actions.set('documentViewer/tocBeingEdited', false));
    dispatch(formActions.reset('documentViewer.sidepanel.metadata'));
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
    const toc = state.documentViewer.tocForm.map(entry => ({
      ...entry,
      ...(entry === tocElement ? { indentation } : {}),
    }));

    dispatch(formActions.load('documentViewer.tocForm', toc));
  };
}

export function addToToc(textSelectedObject, currentToc) {
  return (dispatch, getState) => {
    const state = getState();
    let toc = (state.documentViewer.tocForm || []).concat();
    if (!toc.length && Array.isArray(currentToc)) {
      toc = currentToc.concat();
    }
    const tocElement = {
      selectionRectangles: textSelectedObject.sourceRange.selectionRectangles,
      label: textSelectedObject.sourceRange.text,
      indentation: 0,
    };

    toc.push(tocElement);
    toc = toc.sort(sortTextSelections);
    dispatch(editToc(toc));
  };
}
