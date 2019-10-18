"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _redux = require("redux");
var _immutable = _interopRequireDefault(require("immutable"));
var _BasicReducer = _interopRequireDefault(require("../../BasicReducer"));
var _Multireducer = require("../../Multireducer");
var _utils = require("../../utils");

var _reactReduxForm = require("react-redux-form");
var _Attachments = require("../../Attachments");
var _prioritySortingCriteria = _interopRequireDefault(require("../../utils/prioritySortingCriteria"));
var _documentsReducer = _interopRequireDefault(require("./documentsReducer"));
var _uiReducer = _interopRequireDefault(require("./uiReducer"));
var _filtersReducer = _interopRequireDefault(require("./filtersReducer"));
var _aggregationsReducer = _interopRequireDefault(require("./aggregationsReducer"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

let templates = null;
if (_utils.isClient) {
  templates = window.__reduxData__ && window.__reduxData__.templates ? _immutable.default.fromJS(window.__reduxData__.templates) : null;
}

const defaultSearch = _prioritySortingCriteria.default.get({ templates });
defaultSearch.searchTerm = '';
defaultSearch.filters = {};var _default =

storeKey => (0, _redux.combineReducers)({
  aggregations: (0, _Multireducer.multireducer)(_aggregationsReducer.default, storeKey),
  documents: (0, _Multireducer.multireducer)(_documentsReducer.default, storeKey),
  ui: (0, _Multireducer.multireducer)((0, _Attachments.manageAttachmentsReducer)(_uiReducer.default, { useDefaults: false, setInArray: ['selectedDocuments', 0] }), storeKey),
  filters: (0, _Multireducer.multireducer)(_filtersReducer.default, storeKey),
  search: (0, _reactReduxForm.modelReducer)(`${storeKey}.search`, defaultSearch),
  searchForm: (0, _reactReduxForm.formReducer)(`${storeKey}.search`, defaultSearch),
  selectedSorting: (0, _BasicReducer.default)(`${storeKey}.selectedSorting`, {}),
  markers: (0, _BasicReducer.default)(`${storeKey}.markers`, { rows: [] }),
  //
  sidepanel: (0, _redux.combineReducers)({
    metadata: (0, _reactReduxForm.modelReducer)(`${storeKey}.sidepanel.metadata`, {}),
    metadataForm: (0, _reactReduxForm.formReducer)(`${storeKey}.sidepanel.metadata`, {}),
    multipleEdit: (0, _reactReduxForm.modelReducer)(`${storeKey}.sidepanel.multipleEdit`, {}),
    multipleEditForm: (0, _reactReduxForm.formReducer)(`${storeKey}.sidepanel.multipleEdit`, {}),
    references: (0, _BasicReducer.default)(`${storeKey}.sidepanel.references`, []),
    snippets: (0, _BasicReducer.default)(`${storeKey}.sidepanel.snippets`, { count: 0, metadata: [], fullText: [] }),
    tab: (0, _BasicReducer.default)(`${storeKey}.sidepanel.tab`, '') }) });exports.default = _default;