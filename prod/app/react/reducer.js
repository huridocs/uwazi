"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _redux = require("redux");
var _BasicReducer = _interopRequireDefault(require("./BasicReducer"));

var _reducer = _interopRequireDefault(require("./Templates/reducers/reducer"));
var _reducer2 = _interopRequireDefault(require("./Pages/reducers/reducer"));
var _notificationsReducer = _interopRequireDefault(require("./Notifications/reducers/notificationsReducer"));

var _reducer3 = _interopRequireDefault(require("./Thesauris/reducers/reducer"));
var _reducer4 = _interopRequireDefault(require("./Activitylog/reducer"));
var _reducer5 = _interopRequireDefault(require("./Viewer/reducers/reducer"));
var _reducer6 = _interopRequireDefault(require("./Entities/reducers/reducer"));
var _contextMenuReducer = _interopRequireDefault(require("./ContextMenu/reducers/contextMenuReducer"));
var _reducer7 = _interopRequireDefault(require("./Connections/reducers/reducer"));
var _reducer8 = _interopRequireDefault(require("./Relationships/reducers/reducer"));
var _reducer9 = _interopRequireDefault(require("./ConnectionsList/reducers/reducer"));
var _Attachments = require("./Attachments");
var _reducer10 = _interopRequireDefault(require("./SemanticSearch/reducers/reducer"));

var _reducer11 = _interopRequireDefault(require("./Library/reducers/reducer"));
var _modalsReducer = _interopRequireDefault(require("./Modals/reducers/modalsReducer"));
var _progressReducer = _interopRequireDefault(require("./Uploads/reducers/progressReducer"));
var _importReducer = _interopRequireDefault(require("./Uploads/reducers/importReducer"));
var _reducer12 = _interopRequireDefault(require("./Auth/reducer"));
var _reducer13 = _interopRequireDefault(require("./Settings/reducers/reducer"));
var _login = _interopRequireDefault(require("./Users/reducers/login"));
var _reducer14 = _interopRequireDefault(require("./Metadata/reducer"));
var _reducer15 = _interopRequireDefault(require("./I18N/reducer"));
var _inlineEditReducer = _interopRequireDefault(require("./I18N/inlineEditReducer"));

var _reactReduxForm = require("react-redux-form");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var _default =

(0, _redux.combineReducers)({
  notifications: _notificationsReducer.default,
  library: (0, _reducer11.default)('library'),
  uploads: (0, _reducer11.default)('uploads'),
  progress: _progressReducer.default,
  importEntities: _importReducer.default,
  locale: _reducer15.default,
  inlineEdit: _inlineEditReducer.default,
  semanticSearch: _reducer10.default,
  activitylog: _reducer4.default,
  inlineEditForm: (0, _reactReduxForm.formReducer)('inlineEditModel', {}),
  inlineEditModel: (0, _reactReduxForm.modelReducer)('inlineEditModel', {}),
  template: _reducer.default,
  page: _reducer2.default,
  thesauri: _reducer3.default,
  entityView: _reducer6.default,
  thesauris: (0, _BasicReducer.default)('thesauris', []),
  customUploads: (0, _BasicReducer.default)('customUploads', []),
  dictionaries: (0, _BasicReducer.default)('dictionaries', []),
  relationTypes: (0, _BasicReducer.default)('relationTypes', []),
  relationType: (0, _reactReduxForm.modelReducer)('relationType', { name: '' }),
  relationTypeForm: (0, _reactReduxForm.formReducer)('relationType', { name: '' }),
  templates: (0, _BasicReducer.default)('templates', []),
  translations: (0, _BasicReducer.default)('translations', []),
  translationsForm: (0, _reactReduxForm.modelReducer)('translationsForm', []),
  translationsFormState: (0, _reactReduxForm.formReducer)('translationsForm'),
  pages: (0, _BasicReducer.default)('pages', []),
  users: (0, _BasicReducer.default)('users', []),
  documentViewer: _reducer5.default,
  contextMenu: _contextMenuReducer.default,
  connections: _reducer7.default,
  connectionsList: _reducer9.default,
  relationships: _reducer8.default,
  attachments: _Attachments.reducer,
  modals: _modalsReducer.default,
  user: _reducer12.default,
  login: _login.default,
  settings: _reducer13.default,
  metadata: _reducer14.default });exports.default = _default;