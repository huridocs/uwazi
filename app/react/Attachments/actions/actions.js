import {APIURL} from 'app/config.js';
import api from 'app/utils/api';
import superagent from 'superagent';
import {notify} from 'app/Notifications/actions/notificationsActions';

import * as types from './actionTypes';

export function uploadAttachment(entityId, file) {
  return function (dispatch) {
    dispatch({type: types.START_UPLOAD_ATTACHMENT, entity: entityId});
    superagent.post(APIURL + 'attachments/upload')
    .set('Accept', 'application/json')
    .field('entityId', entityId)
    .attach('file', file, file.name)
    .on('progress', (data) => {
      dispatch({type: types.ATTACHMENT_PROGRESS, entity: entityId, progress: Math.floor(data.percent)});
    })
    .on('response', (result) => {
      dispatch({type: types.ATTACHMENT_COMPLETE, entity: entityId, file: JSON.parse(result.text)});
    })
    .end();
  };
}

export function deleteAttachment(entityId, attachment) {
  return function (dispatch) {
    return api.delete('attachments/delete', {entityId, filename: attachment.filename})
    .then(() => {
      dispatch({type: types.ATTACHMENT_DELETED, entity: entityId, file: attachment});
      dispatch(notify('Attachment deleted', 'success'));
    });
  };
}
