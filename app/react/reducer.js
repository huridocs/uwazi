import {combineReducers} from 'redux';
import createReducer from 'app/BasicReducer';

import template from 'app/Templates/reducers/reducer';
import page from 'app/Pages/reducers/reducer';
import {reducer as notificationsReducer} from 'app/Notifications';

import thesauri from 'app/Thesauris/reducers/reducer';
import documentViewer from 'app/Viewer/reducers/reducer';
import entityView from 'app/Entities/reducers/reducer';
import contextMenu from 'app/ContextMenu/reducers/contextMenuReducer';
import connections from 'app/Connections';
import {reducer as attachments} from 'app/Attachments';

import library from 'app/Library/reducers/reducer';
import modals from 'app/Modals/reducers/modalsReducer';
import uploads from 'app/Uploads/reducers/reducer';
import user from 'app/Auth/reducer';
import settings from 'app/Settings/reducers/reducer';
import login from 'app/Users/reducer';
import {reducer as metadata} from 'app/Metadata';
import locale from 'app/I18N/reducer';


import {modelReducer, formReducer} from 'react-redux-form';

export default combineReducers({
  notifications: notificationsReducer,
  library,
  locale,
  template,
  page,
  thesauri,
  entityView,
  thesauris: createReducer('thesauris', []),
  dictionaries: createReducer('dictionaries', []),
  relationTypes: createReducer('relationTypes', []),
  relationType: modelReducer('relationType', {name: ''}),
  relationTypeForm: formReducer('relationType', {name: ''}),
  templates: createReducer('templates', []),
  translations: createReducer('translations', []),
  translationsForm: modelReducer('translationsForm', []),
  translationsFormState: formReducer('translationsForm'),
  pages: createReducer('pages', []),
  documentViewer,
  contextMenu,
  connections: connections.reducer,
  attachments,
  modals,
  uploads,
  user,
  login,
  settings,
  metadata,
  search: modelReducer('search', {sort: 'creationDate', order: 'desc', searchTerm: '', filters: {}}),
  searchForm: formReducer('search', {sort: 'creationDate', order: 'desc', searchTerm: '', filters: {}})
});
