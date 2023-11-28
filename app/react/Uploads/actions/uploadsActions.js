import superagent from 'superagent';

import { actions as basicActions } from 'app/BasicReducer';
import { notificationActions } from 'app/Notifications';
import { selectSingleDocument } from 'app/Library/actions/libraryActions';
import * as metadata from 'app/Metadata';
import * as types from 'app/Uploads/actions/actionTypes';
import * as libraryTypes from 'app/Library/actions/actionTypes';
import uniqueID from 'shared/uniqueID';
import { RequestParams } from 'app/utils/RequestParams';
import { t } from 'app/I18N';

import { APIURL } from '../../config.js';
import api from '../../utils/api';
import EntitiesApi from '../../Entities/EntitiesAPI';
import { reloadThesauri } from 'app/Thesauri/actions/thesaurisActions';

export function enterUploads() {
  return {
    type: types.ENTER_UPLOADS_SECTION,
  };
}

export function showImportPanel() {
  return dispatch => {
    dispatch(basicActions.set('showImportPanel', true));
  };
}

export function closeImportPanel() {
  return dispatch => {
    dispatch(basicActions.set('showImportPanel', false));
  };
}

export function closeImportProgress() {
  return dispatch => {
    dispatch(basicActions.set('importProgress', 0));
    dispatch(basicActions.set('importStart', false));
    dispatch(basicActions.set('importEnd', false));
    dispatch(basicActions.set('importError', {}));
  };
}

export function newEntity(storeKey = 'uploads') {
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
    await reloadThesauri()(dispatch);
  };
}

export function createDocument(newDoc) {
  return dispatch =>
    api.post('documents', new RequestParams(newDoc)).then(response => {
      const doc = response.json;
      dispatch({ type: types.NEW_UPLOAD_DOCUMENT, doc: doc.sharedId });
      dispatch({ type: types.ELEMENT_CREATED, doc });
      return doc;
    });
}

export function importData([file], template) {
  return dispatch =>
    new Promise(resolve => {
      superagent
        .post(`${APIURL}import`)
        .set('Accept', 'application/json')
        .set('X-Requested-With', 'XMLHttpRequest')
        .field('template', template)
        .attach('file', file, file.name)
        .on('progress', data => {
          dispatch(basicActions.set('importUploadProgress', Math.floor(data.percent)));
        })
        .on('response', response => {
          dispatch(basicActions.set('importUploadProgress', 0));
          resolve(response);
        })
        .end();
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

export function uploadCustom(file) {
  return dispatch => {
    const id = `customUpload_${uniqueID()}`;
    return upload(
      id,
      file,
      'files/upload/custom'
    )(dispatch).then(response => {
      dispatch(basicActions.push('customUploads', response));
    });
  };
}

export function deleteCustomUpload(_id) {
  return dispatch =>
    api.delete('files', new RequestParams({ _id })).then(response => {
      dispatch(basicActions.remove('customUploads', response.json[0]));
    });
}

export function uploadDocument(docId, file) {
  return async dispatch => upload(docId, file)(dispatch);
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
      dispatch(basicActions.update('entityView/entity', doc));
      dispatch(basicActions.update('viewer/doc', doc));
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
