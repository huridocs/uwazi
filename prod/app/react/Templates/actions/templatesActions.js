"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.deleteTemplate = deleteTemplate;exports.checkTemplateCanBeDeleted = checkTemplateCanBeDeleted;exports.setAsDefault = setAsDefault;var _TemplatesAPI = _interopRequireDefault(require("../TemplatesAPI"));
var _DocumentsAPI = _interopRequireDefault(require("../../Documents/DocumentsAPI"));
var _BasicReducer = require("../../BasicReducer");
var _RequestParams = require("../../utils/RequestParams");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

function deleteTemplate(template) {
  return dispatch => _TemplatesAPI.default.delete(new _RequestParams.RequestParams({ _id: template._id })).
  then(() => {
    dispatch(_BasicReducer.actions.remove('templates', template));
  });
}

function checkTemplateCanBeDeleted(template) {
  return () => _DocumentsAPI.default.countByTemplate(new _RequestParams.RequestParams({ templateId: template._id })).
  then(usedForDocuments => {
    if (usedForDocuments) {
      return Promise.reject();
    }
    return Promise.resolve();
  });
}

function setAsDefault(template) {
  return () => _TemplatesAPI.default.setAsDefault(new _RequestParams.RequestParams({ _id: template._id }));
}