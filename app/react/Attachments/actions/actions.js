import { actions as formActions } from 'react-redux-form';
import superagent from 'superagent';

import { APIURL } from 'app/config.js';
import { notify } from 'app/Notifications/actions/notificationsActions';
import * as libraryTypes from 'app/Library/actions/actionTypes';
import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';

import * as types from './actionTypes';

export function uploadAttachment(entity, file, __reducerKey, options = {}) {
  return dispatch => {
    dispatch({ type: types.START_UPLOAD_ATTACHMENT, entity });
    superagent
      .post(`${APIURL}attachments/upload`)
      .set('Accept', 'application/json')
      .set('X-Requested-With', 'XMLHttpRequest')
      .field('entityId', entity)
      .field('allLanguages', Boolean(options.allLanguages))
      .attach('file', file, file.name)
      .on('progress', data => {
        dispatch({ type: types.ATTACHMENT_PROGRESS, entity, progress: Math.floor(data.percent) });
      })
      .on('response', result => {
        dispatch({
          type: types.ATTACHMENT_COMPLETE,
          entity,
          file: JSON.parse(result.text),
          __reducerKey,
        });
      })
      .end();
  };
}

export function renameAttachment(entityId, form, __reducerKey, file) {
  return dispatch =>
    api
      .post(
        'attachments/rename',
        new RequestParams({
          entityId,
          _id: file._id,
          originalname: file.originalname,
          language: file.language,
        })
      )
      .then(renamedFile => {
        if (entityId === file._id) {
          dispatch({
            type: types.UPDATE_DOCUMENT_FILE,
            entity: entityId,
            file: renamedFile.json,
            __reducerKey,
          });
        }
        dispatch({
          type: types.ATTACHMENT_RENAMED,
          entity: entityId,
          file: renamedFile.json,
          __reducerKey,
        });
        dispatch(formActions.reset(form));
        dispatch(notify('Attachment renamed', 'success'));
      });
}

export function deleteAttachment(entityId, attachment, __reducerKey) {
  return dispatch =>
    api
      .delete(
        'attachments/delete',
        new RequestParams({
          attachmentId: attachment._id,
        })
      )
      .then(response => {
        dispatch({
          type: types.ATTACHMENT_DELETED,
          entity: entityId,
          file: attachment,
          __reducerKey,
        });
        dispatch({ type: libraryTypes.UPDATE_DOCUMENT, doc: response.json, __reducerKey });
        dispatch({ type: libraryTypes.UNSELECT_ALL_DOCUMENTS, __reducerKey });
        dispatch({ type: libraryTypes.SELECT_DOCUMENT, doc: response.json, __reducerKey });
        dispatch(notify('Attachment deleted', 'success'));
      });
}

export function loadForm(form, attachment) {
  return dispatch => {
    dispatch(formActions.reset(form));
    dispatch(formActions.load(form, attachment));
  };
}

export function submitForm(form) {
  return dispatch => {
    dispatch(formActions.submit(form));
  };
}

export function resetForm(form) {
  return dispatch => {
    dispatch(formActions.reset(form));
  };
}
