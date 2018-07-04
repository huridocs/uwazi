import superagent from 'superagent';

import { actions as basicActions } from 'app/BasicReducer';
import { notify } from 'app/Notifications';
import { selectSingleDocument } from 'app/Library/actions/libraryActions';
import * as metadata from 'app/Metadata';
import * as types from 'app/Uploads/actions/actionTypes';
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
    .field('document', docId)
    .attach('file', file, file.name)
    .on('progress', (data) => {
      dispatch({ type: types.UPLOAD_PROGRESS, doc: docId, progress: Math.floor(data.percent) });
    })
    .on('response', (response) => {
      dispatch({ type: types.UPLOAD_COMPLETE, doc: docId });
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

export function documentProcessed(sharedId) {
  return { type: types.DOCUMENT_PROCESSED, sharedId };
}

export function documentProcessError(sharedId) {
  return { type: types.DOCUMENT_PROCESS_ERROR, sharedId };
}

export function publishEntity(entity) {
  return dispatch => api.post('entities', { ...entity, published: true })
  .then(() => {
    dispatch(notify('Entity published', 'success'));
    dispatch({ type: types.REMOVE_DOCUMENT, doc: entity });
  });
}

export function publishDocument(doc) {
  return dispatch => api.post('documents', { ...doc, published: true })
  .then(() => {
    dispatch(notify('Document published', 'success'));
    dispatch({ type: types.REMOVE_DOCUMENT, doc });
  });
}

export function publish(entity) {
  return dispatch => entity.type === 'entity' ? dispatch(publishEntity(entity)) : dispatch(publishDocument(entity));
}

export function conversionComplete(docId) {
  return {
    type: types.CONVERSION_COMPLETE,
    doc: docId
  };
}
