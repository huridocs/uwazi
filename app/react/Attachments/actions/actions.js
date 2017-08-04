import {APIURL} from 'app/config.js';
import api from 'app/utils/api';
import superagent from 'superagent';
import {notify} from 'app/Notifications/actions/notificationsActions';
import {actions as formActions} from 'react-redux-form';

import * as types from './actionTypes';

export function uploadAttachment(entityId, file, __reducerKey, options = {}) {
  return function (dispatch) {
    dispatch({type: types.START_UPLOAD_ATTACHMENT, entity: entityId});
    superagent.post(APIURL + 'attachments/upload')
    .set('Accept', 'application/json')
    .field('entityId', entityId)
    .field('allLanguages', Boolean(options.allLanguages))
    .attach('file', file, file.name)
    .on('progress', (data) => {
      dispatch({type: types.ATTACHMENT_PROGRESS, entity: entityId, progress: Math.floor(data.percent)});
    })
    .on('response', (result) => {
      dispatch({type: types.ATTACHMENT_COMPLETE, entity: entityId, file: JSON.parse(result.text), __reducerKey});
    })
    .end();
  };
}

export function renameAttachment(entityId, form, __reducerKey, file) {
  return function (dispatch) {
    return api.post('attachments/rename', {entityId, _id: file._id, originalname: file.originalname})
    .then(renamedFile => {
      dispatch({type: types.ATTACHMENT_RENAMED, entity: entityId, file: renamedFile.json, __reducerKey});
      dispatch(formActions.reset(form));
      dispatch(notify('Attachment renamed', 'success'));
    });
  };
}

export function deleteAttachment(entityId, attachment, __reducerKey) {
  return function (dispatch) {
    return api.delete('attachments/delete', {entityId, filename: attachment.filename})
    .then(() => {
      dispatch({type: types.ATTACHMENT_DELETED, entity: entityId, file: attachment, __reducerKey});
      dispatch(notify('Attachment deleted', 'success'));
    });
  };
}

export function loadForm(form, attachment) {
  return function (dispatch) {
    dispatch(formActions.reset(form));
    dispatch(formActions.load(form, attachment));
  };
}

export function submitForm(form) {
  return function (dispatch) {
    dispatch(formActions.submit(form));
  };
}

export function resetForm(form) {
  return function (dispatch) {
    dispatch(formActions.reset(form));
  };
}
