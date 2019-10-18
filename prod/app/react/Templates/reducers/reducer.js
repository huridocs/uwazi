"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _redux = require("redux");
var _reactReduxForm = require("react-redux-form");

var _uiReducer = _interopRequireDefault(require("./uiReducer.js"));
var _templateCommonProperties = _interopRequireDefault(require("../utils/templateCommonProperties"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var _default =

(0, _redux.combineReducers)({
  data: (0, _reactReduxForm.modelReducer)('template.data', { name: '', properties: [], commonProperties: _templateCommonProperties.default.get() }),
  formState: (0, _reactReduxForm.formReducer)('template.data'),
  uiState: _uiReducer.default });exports.default = _default;