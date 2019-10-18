"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _redux = require("redux");
var _reactReduxForm = require("react-redux-form");
var _BasicReducer = _interopRequireDefault(require("../../BasicReducer"));

var _uiReducer = _interopRequireDefault(require("./uiReducer.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var _default =

(0, _redux.combineReducers)({
  pageView: (0, _BasicReducer.default)('page/pageView', {}),
  datasets: (0, _BasicReducer.default)('page/datasets', {}),
  itemLists: (0, _BasicReducer.default)('page/itemLists', []),
  data: (0, _reactReduxForm.modelReducer)('page.data', { title: '', metadata: { content: '' } }),
  formState: (0, _reactReduxForm.formReducer)('page.data'),
  uiState: _uiReducer.default });exports.default = _default;