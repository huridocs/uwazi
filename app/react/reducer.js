import { combineReducers } from 'redux';
import { createReducer } from '#app/BasicReducer/index.js';

import { reducer as page } from '#app/Pages/reducers/reducer.js';
import { notificationsReducer as notifications } from '#app/Notifications/reducers/notificationsReducer.js';

import { reducer as documentViewer } from '#app/Viewer/reducers/reducer.js';
import { reducer as entityView } from '#app/Entities/reducers/reducer.js';
import { contextMenuReducer as contextMenu } from '#app/ContextMenu/reducers/contextMenuReducer.js';
import { reducer as connections } from '#app/Connections/reducers/reducer.js';
import { reducer as relationships } from '#app/Relationships/reducers/reducer.js';
import { connectionsListReducer as ConnectionsList } from '#app/ConnectionsList/reducers/reducer.js';
import { reducer as attachments } from '#app/Attachments/index.js';

import { reducer as library } from '#app/Library/reducers/reducer.js';
import { modalsReducer as modals } from '#app/Modals/reducers/modalsReducer.js';
import { progressReducer as progress } from '#app/Uploads/reducers/progressReducer.js';
import { importReducer as importEntities } from '#app/Uploads/reducers/importReducer.js';
import { reducer as user } from '#app/Auth/reducer.js';
import { reducer as settings } from '#app/Settings/reducers/reducer.js';
import { reducer as metadata } from '#app/Metadata/reducer.js';
import { reducer as locale } from '#app/I18N/reducer.js';
import inlineEdit from '#app/I18N/inlineEditReducer.js';
import { exportReducer as exportSearchResults } from '#app/Library/reducers/exportReducer.js';

import { modelReducer, formReducer } from 'react-redux-form';

const rootReducer = combineReducers({
  notifications,
  library: library('library'),
  uploads: library('uploads'),
  progress,
  importEntities,
  locale,
  inlineEdit,
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

export { rootReducer, combineReducers };
