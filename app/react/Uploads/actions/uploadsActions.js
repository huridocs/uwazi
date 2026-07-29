import superagent from 'superagent';

import { actions as basicActions } from '#app/BasicReducer/index.js';
import { notificationActions } from '#app/Notifications/index.js';
import { selectSingleDocument } from '#app/Library/actions/libraryActions.js';
import * as metadata from '#app/Metadata/index.js';
import * as types from '#app/Uploads/actions/actionTypes.js';
import * as libraryTypes from '#app/Library/actions/actionTypes.js';
import { RequestParams } from '#app/utils/RequestParams.js';
import { t } from '#app/I18N/index.js';
import { UploadService } from '#V2/api/files/UploadService.js';
import { APIURL } from '../../config.js';
import { EntitiesAPI as EntitiesApi } from '../../Entities/EntitiesAPI.js';

export function newEntity(storeKey = 'library') {
  return async (dispatch, getState) => {
    const newEntityMetadata = { title: '', type: 'entity' };
    dispatch(
      metadata.actions.loadInReduxForm(
        `${storeKey}.sidepanel.metadata`,
        newEntityMetadata,
        getState().templates.toJS()
      )
    );
    dispatch(basicActions.set('library.sidepanel.tab', 'metadata'));
    dispatch(basicActions.set('relationships/list/connectionsGroups', []));
    await dispatch(selectSingleDocument(newEntityMetadata));
  };
}

export function createDocument(newDoc) {
  return dispatch =>
    EntitiesApi.save(new RequestParams(newDoc)).then(response => {
      const doc = response;
      dispatch({ type: types.NEW_UPLOAD_DOCUMENT, doc: doc.sharedId });
      dispatch({ type: types.ELEMENT_CREATED, doc });
      return doc;
    });
}

export function upload(docId, file, endpoint = 'files/upload/document') {
  return async dispatch =>
    new Promise(resolve => {
      superagent
        .post(APIURL + endpoint)
        .set('Accept', 'application/json')
        .set('X-Requested-With', 'XMLHttpRequest')
        .field('entity', docId)
        .field('originalname', file.name)
        .attach('file', file)
        .on('progress', data => {
          dispatch({
            type: types.UPLOAD_PROGRESS,
            doc: docId,
            progress: Math.floor(data.percent),
          });
        })
        .on('response', response => {
          dispatch({ type: types.UPLOAD_COMPLETE, doc: docId, file: response.body });
          resolve(JSON.parse(response.text));
        })
        .end();
    });
}

export function publicSubmit(data, remote = false) {
  return dispatch =>
    new Promise(resolve => {
      const request = superagent
        .post(remote ? `${APIURL}remotepublic` : `${APIURL}public`)
        .set('Accept', 'application/json')
        .set('X-Requested-With', 'XMLHttpRequest')
        .field('captcha', JSON.stringify(data.captcha));

      if (data.file) {
        request.attach('file', data.file);
      }

      if (data.attachments) {
        data.attachments.forEach((attachment, index) => {
          request.attach(`attachments[${index}]`, attachment);
          request.field(`attachments_originalname[${index}]`, attachment.name);
        });
      }
      request.field(
        'entity',
        JSON.stringify({ title: data.title, template: data.template, metadata: data.metadata })
      );
      let completionResolve;
      let completionReject;
      const uploadCompletePromise = new Promise((_resolve, _reject) => {
        completionResolve = _resolve;
        completionReject = _reject;
      });
      request
        .on('progress', () => {
          resolve({ promise: uploadCompletePromise });
        })
        .on('response', response => {
          if (response.status === 200) {
            dispatch(notificationActions.notify(t('System', 'Success', null, false), 'success'));
            completionResolve(response);
            return;
          }
          if (response.status === 403) {
            dispatch(notificationActions.notify(response.body.error, 'danger'));
            completionReject(response);
            return;
          }
          completionReject(response);

          dispatch(
            notificationActions.notify(t('System', 'An error occurred', null, false), 'danger')
          );
        })
        .end();
    });
}

export function updateMainDocument(docId, file) {
  return async dispatch => dispatch({ type: types.UPDATE_MAIN_DOC, doc: docId, file });
}

export function uploadDocument(docId, file) {
  return async dispatch => upload(docId, file)(dispatch);
}

export function createFromPDF(files, onProgress, onFileComplete) {
  return async dispatch => {
    const uploadService = new UploadService('createFromPDF');

    uploadService.onProgress((filename, progress) => {
      onProgress?.(progress, filename);
    });

    uploadService.onUploadComplete(() => {
      onFileComplete?.();
    });

    const responses = await uploadService.upload(files);

    responses.forEach(response => {
      if (response?.data) {
        dispatch({
          type: libraryTypes.ELEMENT_CREATED,
          doc: response.data,
          __reducerKey: 'library',
        });
      }
    });

    return responses.length;
  };
}

export function uploadAndCreate(files, onProgress, onFileComplete) {
  return async dispatch => createFromPDF(files, onProgress, onFileComplete)(dispatch);
}

export function documentProcessed(sharedId, __reducerKey) {
  return dispatch => {
    EntitiesApi.get(new RequestParams({ sharedId })).then(([doc]) => {
      dispatch({ type: types.UPLOAD_PROGRESS, doc: sharedId, progress: 100 });
      dispatch({ type: libraryTypes.UPDATE_DOCUMENT, doc, __reducerKey });
      dispatch({ type: libraryTypes.UNSELECT_ALL_DOCUMENTS, __reducerKey });
      dispatch({ type: libraryTypes.SELECT_DOCUMENT, doc, __reducerKey });
      dispatch({
        type: types.UPLOADS_COMPLETE,
        doc: sharedId,
        files: doc.documents,
        __reducerKey: 'library',
      });
      dispatch({ type: types.BATCH_UPLOAD_COMPLETE, doc: sharedId });
    });
  };
}

export function conversionComplete(docId) {
  return {
    type: types.CONVERSION_COMPLETE,
    doc: docId,
  };
}
