import superagent from 'superagent';
import {APIURL} from '../../config.js';
import {notify} from 'app/Notifications';
import * as types from 'app/Uploads/actions/actionTypes';
import api from '../../utils/api';

export function enterUploads() {
  return {
    type: types.ENTER_UPLOADS_SECTION
  };
}

export function editDocument(doc) {
  return {
    type: types.EDIT_UPLOADED_DOCUMENT,
    doc
  };
}

export function updateDocument(doc) {
  return {
    type: types.UPDATE_DOCUMENT,
    doc
  };
}

export function finishEdit() {
  return {
    type: types.FINISH_UPLOADED_DOCUMENT_EDIT
  };
}

export function setUploads(documents) {
  return {
    type: types.SET_UPLOADS,
    documents
  };
}

export function setTemplates(templates) {
  return {
    type: types.SET_TEMPLATES_UPLOADS,
    templates
  };
}

export function setThesauris(thesauris) {
  return {
    type: types.SET_THESAURIS_UPLOADS,
    thesauris
  };
}

export function uploadDocument(newDoc, file) {
  return function (dispatch) {
    return api.post('documents', newDoc)
    .then((response) => {
      let doc = response.json;
      dispatch({type: types.NEW_UPLOAD_DOCUMENT, doc});

      superagent.post(APIURL + 'upload')
      .set('Accept', 'application/json')
      .field('document', doc._id)
      .attach('file', file, file.name)
      .on('progress', (data) => {
        dispatch({type: types.UPLOAD_PROGRESS, doc: doc._id, progress: Math.floor(data.percent)});
      })
      .on('response', () => {
        dispatch({type: types.UPLOAD_COMPLETE, doc: doc._id});
      })
      .end();
    });
  };
}

export function saveDocument(doc) {
  return function (dispatch) {
    return api.post('documents', doc)
    .then(() => {
      dispatch(notify('Document updated', 'success'));
      dispatch(updateDocument(doc));
      dispatch({type: types.FINISH_UPLOADED_DOCUMENT_EDIT});
    });
  };
}

export function moveToLibrary(doc) {
  return function (dispatch) {
    doc.published = true;
    return api.post('documents', doc)
    .then(() => {
      dispatch(notify('Document published', 'success'));
      dispatch({type: types.MOVED_TO_LIBRARY, doc: doc._id});
    });
  };
}

export function deleteDocument(doc) {
  return function (dispatch) {
    return api.delete('documents', doc)
    .then(() => {
      dispatch(notify('Document deleted', 'success'));
      dispatch({type: types.DOCUMENT_DELETED, doc: doc._id});
    });
  };
}

export function conversionComplete(docId) {
  return {
    type: types.CONVERSION_COMPLETE,
    doc: docId
  };
}
