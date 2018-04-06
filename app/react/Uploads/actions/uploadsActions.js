import superagent from 'superagent';

import { notify } from 'app/Notifications';
import { selectSingleDocument } from 'app/Library/actions/libraryActions';
import * as metadata from 'app/Metadata';
import * as types from 'app/Uploads/actions/actionTypes';

import { APIURL } from '../../config.js';
import api from '../../utils/api';

export function enterUploads() {
  return {
    type: types.ENTER_UPLOADS_SECTION
  };
}

export function newEntity() {
  return function (dispatch, getState) {
    const newEntityMetadata = { title: '', type: 'entity' };
    dispatch(metadata.actions.loadInReduxForm('uploads.sidepanel.metadata', newEntityMetadata, getState().templates.toJS()));
    dispatch(selectSingleDocument(newEntityMetadata));
  };
}

export function createDocument(newDoc) {
  return function (dispatch) {
    return api.post('documents', newDoc)
    .then((response) => {
      const doc = response.json;
      dispatch({ type: types.NEW_UPLOAD_DOCUMENT, doc: doc.sharedId });
      dispatch({ type: types.ELEMENT_CREATED, doc });
      return doc;
    });
  };
}

export function uploadDocument(docId, file) {
  return function (dispatch) {
    superagent.post(`${APIURL}upload`)
    .set('Accept', 'application/json')
    .field('document', docId)
    .attach('file', file, file.name)
    .on('progress', (data) => {
      dispatch({ type: types.UPLOAD_PROGRESS, doc: docId, progress: Math.floor(data.percent) });
    })
    .on('response', () => {
      dispatch({ type: types.UPLOAD_COMPLETE, doc: docId });
    })
    .end();
  };
}

export function documentProcessed(sharedId) {
  return { type: types.DOCUMENT_PROCESSED, sharedId };
}

export function documentProcessError(sharedId) {
  return { type: types.DOCUMENT_PROCESS_ERROR, sharedId };
}

export function publishEntity(entity) {
  return function (dispatch) {
    entity.published = true;
    return api.post('entities', entity)
    .then(() => {
      dispatch(notify('Entity published', 'success'));
      dispatch({ type: types.REMOVE_DOCUMENT, doc: entity });
    });
  };
}

export function publishDocument(doc) {
  return function (dispatch) {
    doc.published = true;
    return api.post('documents', doc)
    .then(() => {
      dispatch(notify('Document published', 'success'));
      dispatch({ type: types.REMOVE_DOCUMENT, doc });
    });
  };
}

export function publish(entity) {
  return function (dispatch) {
    return entity.type === 'entity' ? dispatch(publishEntity(entity)) : dispatch(publishDocument(entity));
  };
}

export function conversionComplete(docId) {
  return {
    type: types.CONVERSION_COMPLETE,
    doc: docId
  };
}
