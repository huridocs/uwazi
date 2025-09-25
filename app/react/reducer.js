/** @format */

import { combineReducers } from 'redux';
import createReducer from '#app/BasicReducer/index.js';

import page from '#app/Pages/reducers/reducer.js';
import notifications from '#app/Notifications/reducers/notificationsReducer.js';

import documentViewer from '#app/Viewer/reducers/reducer.js';
import entityView from '#app/Entities/reducers/reducer.js';
import contextMenu from '#app/ContextMenu/reducers/contextMenuReducer.js';
import connections from '#app/Connections/reducers/reducer.js';
import relationships from '#app/Relationships/reducers/reducer.js';
import ConnectionsList from '#app/ConnectionsList/reducers/reducer.js';
import { reducer as attachments } from '#app/Attachments.js';
import semanticSearch from '#app/SemanticSearch/reducers/reducer.js';

import library from '#app/Library/reducers/reducer.js';
import modals from '#app/Modals/reducers/modalsReducer.js';
import progress from '#app/Uploads/reducers/progressReducer.js';
import importEntities from '#app/Uploads/reducers/importReducer.js';
import user from '#app/Auth/reducer.js';
import settings from '#app/Settings/reducers/reducer.js';
import metadata from '#app/Metadata/reducer.js';
import locale from '#app/I18N/reducer.js';
import inlineEdit from '#app/I18N/inlineEditReducer.js';
import exportSearchResults from '#app/Library/reducers/exportReducer.js';

import { modelReducer, formReducer } from 'react-redux-form';

export default combineReducers({
  notifications,
  library: library('library'),
  uploads: library('uploads'),
  progress,
  importEntities,
  locale,
  inlineEdit,
  semanticSearch,
  inlineEditForm: formReducer('inlineEditModel', {}),
  inlineEditModel: modelReducer('inlineEditModel', {}),
  page,
  settings,
  entityView,
  thesauris: createReducer('thesauris', []),
  entityThesauris: createReducer('entityThesauris', {}),
  customUploads: createReducer('customUploads', []),
  dictionaries: createReducer('dictionaries', []),
  relationTypes: createReducer('relationTypes', []),
  relationType: modelReducer('relationType', { name: '' }),
  relationTypeForm: formReducer('relationType', { name: '' }),
  templates: createReducer('templates', []),
  translations: createReducer('translations', []),
  translationsForm: modelReducer('translationsForm', []),
  translationsFormState: formReducer('translationsForm'),
  pages: createReducer('pages', []),
  users: createReducer('users', []),
  documentViewer,
  contextMenu,
  connections,
  connectionsList: ConnectionsList,
  relationships,
  attachments,
  modals,
  user,
  metadata,
  exportSearchResults,
  userGroups: createReducer('userGroups', []),
  ixExtractors: createReducer('ixExtractors', []),
});
