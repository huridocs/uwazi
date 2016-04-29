import api from '../../utils/singleton_api';
import {notify} from 'app/Notifications';
import * as types from 'app/Uploads/actions/actionTypes';

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
