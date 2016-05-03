import superagent from 'superagent';
import {APIURL} from '../../config.js';
import {notify} from 'app/Notifications';
import * as types from 'app/Uploads/actions/actionTypes';
import api from '../../utils/singleton_api';

export function editDocument(doc) {
  return {
    type: types.EDIT_UPLOADED_DOCUMENT,
    doc
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

export function saveDocument(data) {
  return function (dispatch) {
    return api.post('documents', data)
    .then(() => {
      dispatch(notify('saved successfully !', 'info'));
    });
  };
}

export function moveToLibrary(data) {
  return function (dispatch) {
    data.published = true;
    return api.post('documents', data)
    .then(() => {
      dispatch(notify('moved successfully !', 'info'));
    });
  };
}

export function conversionComplete(docId) {
  return {
    type: types.CONVERSION_COMPLETE,
    doc: docId
  };
}
