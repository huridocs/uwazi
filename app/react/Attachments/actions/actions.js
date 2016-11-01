import superagent from 'superagent';
import {APIURL} from 'app/config.js';
import * as types from './actionTypes';

export function uploadAttachment(entityId, file) {
  return function (dispatch) {
    dispatch({type: types.START_UPLOAD_ATTACHMENT, doc: entityId});
    superagent.post(APIURL + 'attachments/upload')
    .set('Accept', 'application/json')
    .field('entityId', entityId)
    .attach('file', file, file.name)
    .on('progress', (data) => {
      dispatch({type: types.ATTACHMENT_PROGRESS, doc: entityId, progress: Math.floor(data.percent)});
    })
    .on('response', () => {
      dispatch({type: types.ATTACHMENT_COMPLETE, doc: entityId});
    })
    .end();
  };
}
