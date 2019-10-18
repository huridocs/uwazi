"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.enterUploads = enterUploads;exports.showImportPanel = showImportPanel;exports.closeImportPanel = closeImportPanel;exports.closeImportProgress = closeImportProgress;exports.newEntity = newEntity;exports.createDocument = createDocument;exports.importData = importData;exports.upload = upload;exports.publicSubmit = publicSubmit;exports.uploadCustom = uploadCustom;exports.deleteCustomUpload = deleteCustomUpload;exports.uploadDocument = uploadDocument;exports.documentProcessed = documentProcessed;exports.documentProcessError = documentProcessError;exports.publishEntity = publishEntity;exports.publishDocument = publishDocument;exports.unpublishEntity = unpublishEntity;exports.unpublishDocument = unpublishDocument;exports.publish = publish;exports.unpublish = unpublish;exports.conversionComplete = conversionComplete;var _superagent = _interopRequireDefault(require("superagent"));

var _BasicReducer = require("../../BasicReducer");
var _Notifications = require("../../Notifications");
var _libraryActions = require("../../Library/actions/libraryActions");
var metadata = _interopRequireWildcard(require("../../Metadata"));
var types = _interopRequireWildcard(require("./actionTypes"));
var libraryTypes = _interopRequireWildcard(require("../../Library/actions/actionTypes"));
var _uniqueID = _interopRequireDefault(require("../../../shared/uniqueID"));
var _RequestParams = require("../../utils/RequestParams");

var _config = require("../../config.js");
var _api = _interopRequireDefault(require("../../utils/api"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}

function enterUploads() {
  return {
    type: types.ENTER_UPLOADS_SECTION };

}

function showImportPanel() {
  return dispatch => {
    dispatch(_BasicReducer.actions.set('showImportPanel', true));
  };
}

function closeImportPanel() {
  return dispatch => {
    dispatch(_BasicReducer.actions.set('showImportPanel', false));
  };
}

function closeImportProgress() {
  return dispatch => {
    dispatch(_BasicReducer.actions.set('importProgress', 0));
    dispatch(_BasicReducer.actions.set('importStart', false));
    dispatch(_BasicReducer.actions.set('importEnd', false));
    dispatch(_BasicReducer.actions.set('importError', {}));
  };
}

function newEntity() {
  return (dispatch, getState) => {
    const newEntityMetadata = { title: '', type: 'entity' };
    dispatch(metadata.actions.loadInReduxForm('uploads.sidepanel.metadata', newEntityMetadata, getState().templates.toJS()));
    dispatch((0, _libraryActions.selectSingleDocument)(newEntityMetadata));
  };
}

function createDocument(newDoc) {
  return dispatch => _api.default.post('documents', new _RequestParams.RequestParams(newDoc)).
  then(response => {
    const doc = response.json;
    dispatch({ type: types.NEW_UPLOAD_DOCUMENT, doc: doc.sharedId });
    dispatch({ type: types.ELEMENT_CREATED, doc });
    return doc;
  });
}

function importData([file], template) {
  return dispatch => new Promise(resolve => {
    _superagent.default.post(`${_config.APIURL}import`).
    set('Accept', 'application/json').
    set('X-Requested-With', 'XMLHttpRequest').
    field('template', template).
    attach('file', file, file.name).
    on('progress', data => {
      dispatch(_BasicReducer.actions.set('importUploadProgress', Math.floor(data.percent)));
    }).
    on('response', response => {
      dispatch(_BasicReducer.actions.set('importUploadProgress', 0));
      resolve(response);
    }).
    end();
  });
}

function upload(docId, file, endpoint = 'upload') {
  return dispatch => new Promise(resolve => {
    _superagent.default.post(_config.APIURL + endpoint).
    set('Accept', 'application/json').
    set('X-Requested-With', 'XMLHttpRequest').
    field('document', docId).
    attach('file', file, file.name).
    on('progress', data => {
      dispatch({ type: types.UPLOAD_PROGRESS, doc: docId, progress: Math.floor(data.percent) });
    }).
    on('response', response => {
      const _file = { filename: response.body.filename, originalname: response.body.originalname, size: response.body.size };
      dispatch({ type: types.UPLOAD_COMPLETE, doc: docId, file: _file });
      resolve(JSON.parse(response.text));
    }).
    end();
  });
}

function publicSubmit(data, remote = false) {
  return dispatch => new Promise(resolve => {
    const request = _superagent.default.post(remote ? `${_config.APIURL}remotepublic` : `${_config.APIURL}public`).
    set('Accept', 'application/json').
    set('X-Requested-With', 'XMLHttpRequest').
    field('captcha', data.captcha);

    if (data.file) {
      request.attach('file', data.file);
    }

    if (data.attachments) {
      data.attachments.forEach((attachment, index) => {
        request.attach(`attachments[${index}]`, attachment);
      });
    }
    request.field('entity', JSON.stringify(Object.assign({}, { title: data.title, template: data.template, metadata: data.metadata })));
    let completionResolve;
    let completionReject;
    const uploadCompletePromise = new Promise((_resolve, _reject) => {completionResolve = _resolve;completionReject = _reject;});
    request.
    on('progress', () => {
      resolve({ promise: uploadCompletePromise });
    }).
    on('response', response => {
      if (response.status === 200) {
        dispatch(_Notifications.notificationActions.notify('Success', 'success'));
        completionResolve(response);
        return;
      }
      if (response.status === 403) {
        dispatch(_Notifications.notificationActions.notify(response.body.error, 'danger'));
        completionReject(response);
        return;
      }
      completionReject(response);
      dispatch(_Notifications.notificationActions.notify('An error has ocurred', 'danger'));
    }).
    end();
  });
}

function uploadCustom(file) {
  return dispatch => {
    const id = `customUpload_${(0, _uniqueID.default)()}`;
    return upload(id, file, 'customisation/upload')(dispatch).
    then(response => {
      dispatch(_BasicReducer.actions.push('customUploads', response));
    });
  };
}

function deleteCustomUpload(_id) {
  return dispatch => _api.default.delete('customisation/upload', new _RequestParams.RequestParams({ _id })).
  then(response => {
    dispatch(_BasicReducer.actions.remove('customUploads', response.json));
  });
}

function uploadDocument(docId, file) {
  return dispatch => upload(docId, file)(dispatch);
}

function documentProcessed(sharedId, __reducerKey) {
  return dispatch => {
    dispatch({ type: types.DOCUMENT_PROCESSED, sharedId });
    _api.default.get('entities', new _RequestParams.RequestParams({ sharedId })).
    then(response => {
      const doc = response.json.rows[0];
      dispatch({ type: libraryTypes.UPDATE_DOCUMENT, doc, __reducerKey });
      dispatch({ type: libraryTypes.UNSELECT_ALL_DOCUMENTS, __reducerKey });
      dispatch({ type: libraryTypes.SELECT_DOCUMENT, doc, __reducerKey });
      dispatch(_BasicReducer.actions.set('entityView/entity', doc));
      dispatch(_BasicReducer.actions.set('viewer/doc', doc));
    });
  };
}

function documentProcessError(sharedId) {
  return { type: types.DOCUMENT_PROCESS_ERROR, sharedId };
}

function publishEntity(entity) {
  return dispatch => _api.default.post('entities', new _RequestParams.RequestParams(_objectSpread({}, entity, { published: true }))).
  then(response => {
    dispatch(_Notifications.notificationActions.notify('Entity published', 'success'));
    dispatch({ type: types.REMOVE_DOCUMENT, doc: entity });
    dispatch(_BasicReducer.actions.set('entityView/entity', response.json));
    dispatch((0, _libraryActions.unselectAllDocuments)());
  });
}

function publishDocument(doc) {
  return dispatch => _api.default.post('documents', new _RequestParams.RequestParams(_objectSpread({}, doc, { published: true }))).
  then(response => {
    dispatch(_Notifications.notificationActions.notify('Document published', 'success'));
    dispatch({ type: types.REMOVE_DOCUMENT, doc });
    dispatch(_BasicReducer.actions.set('viewer/doc', response.json));
    dispatch((0, _libraryActions.unselectAllDocuments)());
  });
}

function unpublishEntity(entity) {
  return dispatch => _api.default.post('entities', new _RequestParams.RequestParams(_objectSpread({}, entity, { published: true }))).
  then(response => {
    dispatch(_Notifications.notificationActions.notify('Entity unpublished', 'success'));
    dispatch({ type: types.REMOVE_DOCUMENT, doc: entity });
    dispatch(_BasicReducer.actions.set('entityView/entity', response.json));
    dispatch((0, _libraryActions.unselectAllDocuments)());
  });
}

function unpublishDocument(doc) {
  return dispatch => _api.default.post('documents', new _RequestParams.RequestParams(_objectSpread({}, doc, { published: false }))).
  then(response => {
    dispatch(_Notifications.notificationActions.notify('Document unpublished', 'success'));
    dispatch({ type: types.REMOVE_DOCUMENT, doc });
    dispatch(_BasicReducer.actions.set('viewer/doc', response.json));
    dispatch((0, _libraryActions.unselectAllDocuments)());
  });
}

function publish(entity) {
  return dispatch => !entity.file ? dispatch(publishEntity(entity)) : dispatch(publishDocument(entity));
}

function unpublish(entity) {
  return dispatch => !entity.file ? dispatch(unpublishEntity(entity)) : dispatch(unpublishDocument(entity));
}

function conversionComplete(docId) {
  return {
    type: types.CONVERSION_COMPLETE,
    doc: docId };

}