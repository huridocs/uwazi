"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.uploadAttachment = uploadAttachment;exports.renameAttachment = renameAttachment;exports.deleteAttachment = deleteAttachment;exports.loadForm = loadForm;exports.submitForm = submitForm;exports.resetForm = resetForm;var _reactReduxForm = require("react-redux-form");
var _superagent = _interopRequireDefault(require("superagent"));

var _config = require("../../config.js");
var _notificationsActions = require("../../Notifications/actions/notificationsActions");
var libraryTypes = _interopRequireWildcard(require("../../Library/actions/actionTypes"));
var _api = _interopRequireDefault(require("../../utils/api"));
var _RequestParams = require("../../utils/RequestParams");


var types = _interopRequireWildcard(require("./actionTypes"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

function uploadAttachment(entity, file, __reducerKey, options = {}) {
  return dispatch => {
    dispatch({ type: types.START_UPLOAD_ATTACHMENT, entity });
    _superagent.default.post(`${_config.APIURL}attachments/upload`).
    set('Accept', 'application/json').
    set('X-Requested-With', 'XMLHttpRequest').
    field('entityId', entity).
    field('allLanguages', Boolean(options.allLanguages)).
    attach('file', file, file.name).
    on('progress', data => {
      dispatch({ type: types.ATTACHMENT_PROGRESS, entity, progress: Math.floor(data.percent) });
    }).
    on('response', result => {
      dispatch({ type: types.ATTACHMENT_COMPLETE, entity, file: JSON.parse(result.text), __reducerKey });
    }).
    end();
  };
}

function renameAttachment(entityId, form, __reducerKey, file) {
  return dispatch => _api.default.post(
  'attachments/rename',
  new _RequestParams.RequestParams({ entityId, _id: file._id, originalname: file.originalname, language: file.language })).

  then(renamedFile => {
    if (entityId === file._id) {
      dispatch({ type: types.UPDATE_DOCUMENT_FILE, entity: entityId, file: renamedFile.json, __reducerKey });
    }
    dispatch({ type: types.ATTACHMENT_RENAMED, entity: entityId, file: renamedFile.json, __reducerKey });
    dispatch(_reactReduxForm.actions.reset(form));
    dispatch((0, _notificationsActions.notify)('Attachment renamed', 'success'));
  });
}

function deleteAttachment(entityId, attachment, __reducerKey) {
  return dispatch => _api.default.delete('attachments/delete', new _RequestParams.RequestParams({
    attachmentId: attachment._id })).

  then(response => {
    dispatch({ type: types.ATTACHMENT_DELETED, entity: entityId, file: attachment, __reducerKey });
    dispatch({ type: libraryTypes.UPDATE_DOCUMENT, doc: response.json, __reducerKey });
    dispatch({ type: libraryTypes.UNSELECT_ALL_DOCUMENTS, __reducerKey });
    dispatch({ type: libraryTypes.SELECT_DOCUMENT, doc: response.json, __reducerKey });
    dispatch((0, _notificationsActions.notify)('Attachment deleted', 'success'));
  });
}

function loadForm(form, attachment) {
  return dispatch => {
    dispatch(_reactReduxForm.actions.reset(form));
    dispatch(_reactReduxForm.actions.load(form, attachment));
  };
}

function submitForm(form) {
  return dispatch => {
    dispatch(_reactReduxForm.actions.submit(form));
  };
}

function resetForm(form) {
  return dispatch => {
    dispatch(_reactReduxForm.actions.reset(form));
  };
}