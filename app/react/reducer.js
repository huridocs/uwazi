/** @format */

import { combineReducers } from 'redux';
import createReducer from 'app/BasicReducer';

import template from 'app/Templates/reducers/reducer';
import page from 'app/Pages/reducers/reducer';
import notifications from 'app/Notifications/reducers/notificationsReducer';

import thesauri from 'app/Thesauri/reducers/reducer';
import documentViewer from 'app/Viewer/reducers/reducer';
import entityView from 'app/Entities/reducers/reducer';
import contextMenu from 'app/ContextMenu/reducers/contextMenuReducer';
import connections from 'app/Connections/reducers/reducer';
import relationships from 'app/Relationships/reducers/reducer';
import ConnectionsList from 'app/ConnectionsList/reducers/reducer';
import { reducer as attachments } from 'app/Attachments';
import semanticSearch from 'app/SemanticSearch/reducers/reducer';

import library from 'app/Library/reducers/reducer';
import modals from 'app/Modals/reducers/modalsReducer';
import progress from 'app/Uploads/reducers/progressReducer';
import importEntities from 'app/Uploads/reducers/importReducer';
import user from 'app/Auth/reducer';
import settings from 'app/Settings/reducers/reducer';
import metadata from 'app/Metadata/reducer';
import locale from 'app/I18N/reducer';
import inlineEdit from 'app/I18N/inlineEditReducer';
import oneUpReview from 'app/Review/reducers/reducer';
import exportSearchResults from 'app/Library/reducers/exportReducer';

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
  template,
  page,
  thesauri,
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
  settings,
  metadata,
  oneUpReview,
  exportSearchResults,
  userGroups: createReducer('userGroups', []),
  ixExtractors: createReducer('ixExtractors', []),
});
