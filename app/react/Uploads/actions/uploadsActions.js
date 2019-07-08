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

export function showImportPanel() {
  return (dispatch) => {
    dispatch(basicActions.set('showImportPanel', true));
  };
}

export function closeImportPanel() {
  return (dispatch) => {
    dispatch(basicActions.set('showImportPanel', false));
  };
}

export function closeImportProgress() {
  return (dispatch) => {
    dispatch(basicActions.set('importProgress', 0));
    dispatch(basicActions.set('importStart', false));
    dispatch(basicActions.set('importEnd', false));
    dispatch(basicActions.set('importError', {}));
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

export function importData([file], template) {
  return dispatch => new Promise((resolve) => {
    superagent.post(`${APIURL}import`)
    .set('Accept', 'application/json')
    .set('X-Requested-With', 'XMLHttpRequest')
    .field('template', template)
    .attach('file', file, file.name)
    .on('progress', (data) => {
      dispatch(basicActions.set('importUploadProgress', Math.floor(data.percent)));
    })
    .on('response', (response) => {
      dispatch(basicActions.set('importUploadProgress', 0));
      resolve(response);
    })
    .end();
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

export function publicSubmit(data, remote = false) {
  return dispatch => new Promise((resolve, reject) => {
    const url = remote ? `${APIURL}remotepublic` : `${APIURL}public`;
    const request = superagent.post(url)
    .set('Accept', 'application/json')
    .set('X-Requested-With', 'XMLHttpRequest')
    .field('captcha', data.captcha);
    delete data.captcha;

    if (data.file) {
      request.attach('file', data.file);
      delete data.file;
    }

    if (data.attachments) {
      data.attachments.forEach((attachment, index) => {
        request.attach(`attachments[${index}]`, attachment);
        delete data.attachments;
      });
    }

    request.field('entity', JSON.stringify(data));

    request
    .on('response', (response) => {
      if (response.status === 200) {
        dispatch(notify('Success', 'success'));
        resolve(response);
        return;
      }

      reject(response);
      if (response.status === 403) {
        dispatch(notify('Captcha error', 'danger'));
        return;
      }

      dispatch(notify('An error has ocurred', 'danger'));
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
      const doc = response.json.rows[0];
      dispatch({ type: libraryTypes.UPDATE_DOCUMENT, doc, __reducerKey });
      dispatch({ type: libraryTypes.UNSELECT_ALL_DOCUMENTS, __reducerKey });
      dispatch({ type: libraryTypes.SELECT_DOCUMENT, doc, __reducerKey });
      dispatch(basicActions.set('entityView/entity', doc));
      dispatch(basicActions.set('viewer/doc', doc));
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
