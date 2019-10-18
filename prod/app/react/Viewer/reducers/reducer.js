"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _redux = require("redux");

var _BasicReducer = _interopRequireDefault(require("../../BasicReducer"));
var _reactReduxForm = require("react-redux-form");

var _Attachments = require("../../Attachments");
var _referencesReducer = _interopRequireDefault(require("./referencesReducer"));
var _uiReducer = _interopRequireDefault(require("./uiReducer"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var _default =

(0, _redux.combineReducers)({
  doc: (0, _Attachments.manageAttachmentsReducer)((0, _BasicReducer.default)('viewer/doc', {})),
  targetDoc: (0, _BasicReducer.default)('viewer/targetDoc', {}),
  rawText: (0, _BasicReducer.default)('viewer/rawText', ''),
  targetDocReferences: (0, _BasicReducer.default)('viewer/targetDocReferences', []),
  references: _referencesReducer.default,
  uiState: _uiReducer.default,
  relationTypes: (0, _BasicReducer.default)('viewer/relationTypes', []),
  tocForm: (0, _reactReduxForm.modelReducer)('documentViewer.tocForm', []),
  tocFormState: (0, _reactReduxForm.formReducer)('documentViewer.tocForm'),
  tocBeingEdited: (0, _BasicReducer.default)('documentViewer/tocBeingEdited', false),
  sidepanel: (0, _redux.combineReducers)({
    metadata: (0, _reactReduxForm.modelReducer)('documentViewer.sidepanel.metadata'),
    metadataForm: (0, _reactReduxForm.formReducer)('documentViewer.sidepanel.metadata'),
    snippets: (0, _BasicReducer.default)('documentViewer.sidepanel.snippets', { count: 0, metadata: [], fullText: [] }),
    tab: (0, _BasicReducer.default)('viewer.sidepanel.tab', '') }) });exports.default = _default;