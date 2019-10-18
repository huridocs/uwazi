"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _redux = require("redux");
var _reactReduxForm = require("react-redux-form");
var _BasicReducer = _interopRequireDefault(require("../../BasicReducer"));
var _immutable = _interopRequireDefault(require("immutable"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var _default =

(0, _redux.combineReducers)({
  search: (0, _BasicReducer.default)('semanticSearch/search', {}),
  searches: (0, _BasicReducer.default)('semanticSearch/searches', []),
  resultsFiltersForm: (0, _reactReduxForm.formReducer)('semanticSearch.resultsFilters'),
  resultsFilters: (0, _reactReduxForm.modelReducer)('semanticSearch.resultsFilters', { threshold: 0.4, minRelevantSentences: 5 }),
  resultsThreshold: (0, _reactReduxForm.modelReducer)('semanticSearch.resultsThreshold'),
  minRelevantSentences: (0, _reactReduxForm.modelReducer)('semanticSearch.minRelevantSentences'),
  minRelevantScore: (0, _reactReduxForm.modelReducer)('semanticSearch.minRelevantScore'),
  selectedDocument: (0, _BasicReducer.default)('semanticSearch/selectedDocument', _immutable.default.fromJS({})),
  showSemanticSearchPanel: (0, _BasicReducer.default)('semanticSearch/showSemanticSearchPanel', false),
  multipleEdit: (0, _reactReduxForm.modelReducer)('semanticSearch.multipleEdit', { metadata: {} }),
  multipleEditForm: (0, _reactReduxForm.formReducer)('semanticSearch.multipleEdit', { metadata: {} }),
  multiedit: (0, _BasicReducer.default)('semanticSearch/multiedit', []) });exports.default = _default;