import superagent from 'superagent';
import {APIURL} from '../../config.js';
import {notify} from 'app/Notifications';
import * as types from 'app/Uploads/actions/actionTypes';
import metadata from 'app/Metadata';
import api from '../../utils/api';

export function enterUploads() {
  return {
    type: types.ENTER_UPLOADS_SECTION
  };
}

export function selectDocument(doc) {
  let document = doc;
  if (doc.toJS) {
    document = doc.toJS();
  }
  return {type: types.SELECT_DOCUMENT, doc: document};
}

export function unselectDocument(docId) {
  return {type: types.UNSELECT_DOCUMENT, docId};
}

export function unselectAllDocuments() {
  return {type: types.UNSELECT_ALL_DOCUMENTS};
}

export function updateSelectedEntities(entities) {
  return {type: types.UPDATE_SELECTED_ENTITIES, entities};
}

export function updateDocument(doc) {
  return {
    type: types.UPDATE_DOCUMENT,
    doc
  };
}

export function updateEntities(updatedDocs) {
  return {type: types.UPDATE_DOCUMENTS, docs: updatedDocs};
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
    let newEntityMetadata = {title: '', type: 'entity'};
    dispatch(metadata.actions.loadInReduxForm('uploads.metadata', newEntityMetadata, templates));
    dispatch(selectDocument(newEntityMetadata));
  };
}

export function saveEntity(entity) {
  return function (dispatch) {
    return api.post('entities', entity)
    .then((response) => {
      dispatch(notify('Entity saved', 'success'));
      dispatch(unselectAllDocuments());
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
      dispatch(unselectAllDocuments());
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
