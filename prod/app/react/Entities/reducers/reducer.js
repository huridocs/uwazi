"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _redux = require("redux");
var _BasicReducer = _interopRequireDefault(require("../../BasicReducer"));
var _reactReduxForm = require("react-redux-form");

var _Attachments = require("../../Attachments");
var _uiReducer = _interopRequireDefault(require("./uiReducer"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var _default =

(0, _redux.combineReducers)({
  entity: (0, _Attachments.manageAttachmentsReducer)((0, _BasicReducer.default)('entityView/entity', {})),
  entityForm: (0, _reactReduxForm.modelReducer)('entityView.entityForm'),
  entityFormState: (0, _reactReduxForm.formReducer)('entityView.entityForm'),
  uiState: _uiReducer.default });exports.default = _default;