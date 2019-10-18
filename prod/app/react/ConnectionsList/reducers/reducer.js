"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _redux = require("redux");
var _reactReduxForm = require("react-redux-form");
var _BasicReducer = _interopRequireDefault(require("../../BasicReducer"));

var _prioritySortingCriteria = _interopRequireDefault(require("../../utils/prioritySortingCriteria"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var _default =

(0, _redux.combineReducers)({
  entityId: (0, _BasicReducer.default)('connectionsList/entityId', ''),
  entity: (0, _BasicReducer.default)('connectionsList/entity', {}),
  connectionsGroups: (0, _BasicReducer.default)('connectionsList/connectionsGroups', []),
  searchResults: (0, _BasicReducer.default)('connectionsList/searchResults', { totalRows: 0, rows: [] }),
  sort: (0, _reactReduxForm.modelReducer)('connectionsList.sort', _prioritySortingCriteria.default.get()),
  filters: (0, _BasicReducer.default)('connectionsList/filters', {}),
  search: (0, _reactReduxForm.formReducer)('connectionsList/search'),
  view: (0, _BasicReducer.default)('connectionsList/view', 'graph') });exports.default = _default;