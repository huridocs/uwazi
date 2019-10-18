"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _redux = require("redux");
var _BasicReducer = _interopRequireDefault(require("../../BasicReducer"));
var _reactReduxForm = require("react-redux-form");

var _uiReducer = _interopRequireDefault(require("./uiReducer.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var _default =

(0, _redux.combineReducers)({
  collection: (0, _BasicReducer.default)('settings/collection', {}),
  navlinksData: (0, _reactReduxForm.modelReducer)('settings.navlinksData', { links: [] }),
  navlinksFormState: (0, _reactReduxForm.formReducer)('settings.navlinksData'),
  form: (0, _reactReduxForm.modelReducer)('account.form', { username: '', password: '' }),
  formState: (0, _reactReduxForm.formReducer)('account.form'),
  settingForm: (0, _reactReduxForm.formReducer)('settings.settings'),
  settings: (0, _reactReduxForm.modelReducer)('settings.settings', {}),
  uiState: _uiReducer.default });exports.default = _default;