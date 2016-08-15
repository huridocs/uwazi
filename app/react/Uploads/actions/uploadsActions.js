import superagent from 'superagent';
import {APIURL} from '../../config.js';
import {notify} from 'app/Notifications';
import * as types from 'app/Uploads/actions/actionTypes';
import entitties from 'app/Entities';
import api from '../../utils/api';

export function enterUploads() {
  return {
    type: types.ENTER_UPLOADS_SECTION
  };
}

export function finishEdit() {
  return {
    type: types.FINISH_EDIT_METADATA
  };
}

export function edit(doc) {
  return function (dispatch) {
    dispatch({type: types.EDIT_METADATA, doc});
  };
}

export function updateDocument(doc) {
  return {
    type: types.UPDATE_DOCUMENT,
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

export function newEntity(templates) {
  return function (dispatch) {
    dispatch(entitties.actions.loadEntity('uploads.metadata', {title: ''}, templates));
    dispatch(edit({title: '', type: 'entity'}));
  };
}

export function saveEntity(entity) {
  return function (dispatch) {
    return api.post('entities', entity)
    .then((response) => {
      dispatch(notify('Entity saved', 'success'));
      if (!entity._id) {
        return dispatch({type: types.ELEMENT_CREATED, doc: response.json});
      }

      return dispatch({type: types.UPDATE_DOCUMENT, doc: response.json});
    });
  };
}

export function publishEntity(entity) {
  return function (dispatch) {
    entity.published = true;
    return api.post('entities', entity)
    .then(() => {
      dispatch(notify('Entity published', 'success'));
      dispatch({type: types.MOVED_TO_LIBRARY, id: entity._id});
    });
  };
}

export function createDocument(newDoc) {
  return function (dispatch) {
    return api.post('documents', newDoc)
    .then((response) => {
      let doc = response.json;
      dispatch({type: types.ELEMENT_CREATED, doc});
      return doc;
    });
  };
}

export function uploadDocument(docId, file) {
  return function (dispatch) {
    dispatch({type: types.NEW_UPLOAD_DOCUMENT, doc: docId});
    superagent.post(APIURL + 'upload')
    .set('Accept', 'application/json')
    .field('document', docId)
    .attach('file', file, file.name)
    .on('progress', (data) => {
      dispatch({type: types.UPLOAD_PROGRESS, doc: docId, progress: Math.floor(data.percent)});
    })
    .on('response', () => {
      dispatch({type: types.UPLOAD_COMPLETE, doc: docId});
    })
    .end();
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
      dispatch({type: types.MOVED_TO_LIBRARY, id: doc._id});
    });
  };
}

export function deleteDocument(doc) {
  return function (dispatch) {
    return api.delete('documents', doc)
    .then(() => {
      dispatch(notify('Document deleted', 'success'));
      dispatch({type: types.ELEMENT_DELETED, id: doc._id});
    });
  };
}

export function deleteEntity(entity) {
  return function (dispatch) {
    return api.delete('entities', entity)
    .then(() => {
      dispatch(notify('Entity deleted', 'success'));
      dispatch({type: types.ELEMENT_DELETED, id: entity._id});
    });
  };
}

export function conversionComplete(docId) {
  return {
    type: types.CONVERSION_COMPLETE,
    doc: docId
  };
}
