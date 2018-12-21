import superagent from 'superagent';

import { actions as basicActions } from 'app/BasicReducer';
import { notify } from 'app/Notifications';
import { selectSingleDocument, unselectAllDocuments } from 'app/Library/actions/libraryActions';
import * as metadata from 'app/Metadata';
import * as types from 'app/Uploads/actions/actionTypes';
import * as libraryTypes from 'app/Library/actions/actionTypes';
import uniqueID from 'shared/uniqueID';

import { APIURL } from '../../config.js';
import api from '../../utils/api';

export function enterUploads() {
  return {
    type: types.ENTER_UPLOADS_SECTION
  };
}

export function newEntity() {
  return (dispatch, getState) => {
    const newEntityMetadata = { title: '', type: 'entity' };
    dispatch(metadata.actions.loadInReduxForm('uploads.sidepanel.metadata', newEntityMetadata, getState().templates.toJS()));
    dispatch(selectSingleDocument(newEntityMetadata));
  };
}

export function createDocument(newDoc) {
  return dispatch => api.post('documents', newDoc)
  .then((response) => {
    const doc = response.json;
    dispatch({ type: types.NEW_UPLOAD_DOCUMENT, doc: doc.sharedId });
    dispatch({ type: types.ELEMENT_CREATED, doc });
    return doc;
  });
}

export function upload(docId, file, endpoint = 'upload') {
  return dispatch => new Promise((resolve) => {
    superagent.post(APIURL + endpoint)
    .set('Accept', 'application/json')
    .set('X-Requested-With', 'XMLHttpRequest')
    .field('document', docId)
    .attach('file', file, file.name)
    .on('progress', (data) => {
      dispatch({ type: types.UPLOAD_PROGRESS, doc: docId, progress: Math.floor(data.percent) });
    })
    .on('response', (response) => {
      const _file = { filename: response.body.filename, originalname: response.body.originalname, size: response.body.size };
      dispatch({ type: types.UPLOAD_COMPLETE, doc: docId, file: _file });
      resolve(JSON.parse(response.text));
    })
    .end();
  });
}

export function uploadCustom(file) {
  return (dispatch) => {
    const id = `customUpload_${uniqueID()}`;
    return upload(id, file, 'customisation/upload')(dispatch)
    .then((response) => {
      dispatch(basicActions.push('customUploads', response));
    });
  };
}

export function deleteCustomUpload(_id) {
  return dispatch => api.delete('customisation/upload', { _id })
  .then((response) => {
    dispatch(basicActions.remove('customUploads', response.json));
  });
}

export function uploadDocument(docId, file) {
  return dispatch => upload(docId, file)(dispatch);
}

export function documentProcessed(sharedId, __reducerKey) {
  return (dispatch) => {
    dispatch({ type: types.DOCUMENT_PROCESSED, sharedId });
    api.get('entities', { _id: sharedId })
    .then((response) => {
      dispatch({ type: libraryTypes.UPDATE_DOCUMENT, doc: response.json.rows[0], __reducerKey });
      dispatch({ type: libraryTypes.UNSELECT_ALL_DOCUMENTS, __reducerKey });
      dispatch({ type: libraryTypes.SELECT_DOCUMENT, doc: response.json.rows[0], __reducerKey });
    });
  };
}

export function documentProcessError(sharedId) {
  return { type: types.DOCUMENT_PROCESS_ERROR, sharedId };
}

export function publishEntity(entity) {
  return dispatch => api.post('entities', { ...entity, published: true })
  .then((response) => {
    dispatch(notify('Entity published', 'success'));
    dispatch({ type: types.REMOVE_DOCUMENT, doc: entity });
    dispatch(basicActions.set('entityView/entity', response.json));
    dispatch(unselectAllDocuments());
  });
}

export function publishDocument(doc) {
  return dispatch => api.post('documents', { ...doc, published: true })
  .then((response) => {
    dispatch(notify('Document published', 'success'));
    dispatch({ type: types.REMOVE_DOCUMENT, doc });
    dispatch(basicActions.set('viewer/doc', response.json));
    dispatch(unselectAllDocuments());
  });
}

export function unpublishEntity(entity) {
  return dispatch => api.post('entities', { ...entity, published: false })
  .then((response) => {
    dispatch(notify('Entity unpublished', 'success'));
    dispatch({ type: types.REMOVE_DOCUMENT, doc: entity });
    dispatch(basicActions.set('entityView/entity', response.json));
    dispatch(unselectAllDocuments());
  });
}

export function unpublishDocument(doc) {
  return dispatch => api.post('documents', { ...doc, published: false })
  .then((response) => {
    dispatch(notify('Document unpublished', 'success'));
    dispatch({ type: types.REMOVE_DOCUMENT, doc });
    dispatch(basicActions.set('viewer/doc', response.json));
    dispatch(unselectAllDocuments());
  });
}

export function publish(entity) {
  return dispatch => !entity.file ? dispatch(publishEntity(entity)) : dispatch(publishDocument(entity));
}

export function unpublish(entity) {
  return dispatch => !entity.file ? dispatch(unpublishEntity(entity)) : dispatch(unpublishDocument(entity));
}

export function conversionComplete(docId) {
  return {
    type: types.CONVERSION_COMPLETE,
    doc: docId
  };
}
