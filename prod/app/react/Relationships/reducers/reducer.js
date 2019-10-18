"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _redux = require("redux");
var _reactReduxForm = require("react-redux-form");
var _BasicReducer = _interopRequireDefault(require("../../BasicReducer"));

var _prioritySortingCriteria = _interopRequireDefault(require("../../utils/prioritySortingCriteria"));
var _hubsReducer = _interopRequireDefault(require("./hubsReducer"));
var _hubActionsReducer = _interopRequireDefault(require("./hubActionsReducer"));
var _uiReducer = _interopRequireDefault(require("./uiReducer"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var _default =


(0, _redux.combineReducers)({
  hubs: _hubsReducer.default,
  hubActions: _hubActionsReducer.default,
  list: (0, _redux.combineReducers)({
    sharedId: (0, _BasicReducer.default)('relationships/list/sharedId', ''),
    entity: (0, _BasicReducer.default)('relationships/list/entity', {}),
    connectionsGroups: (0, _BasicReducer.default)('relationships/list/connectionsGroups', []),
    searchResults: (0, _BasicReducer.default)('relationships/list/searchResults', { totalRows: 0, rows: [] }),
    sort: (0, _reactReduxForm.modelReducer)('relationships/list.sort', _prioritySortingCriteria.default.get()),
    filters: (0, _BasicReducer.default)('relationships/list/filters', {}),
    search: (0, _reactReduxForm.formReducer)('relationships/list/search'),
    view: (0, _BasicReducer.default)('relationships/list/view', 'graph') }),

  searchResults: (0, _BasicReducer.default)('relationships/searchResults', []),
  searchTerm: (0, _BasicReducer.default)('relationships/searchTerm', ''),
  connection: (0, _BasicReducer.default)('relationships/connection', {}),
  uiState: _uiReducer.default });exports.default = _default;