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
import ConnectionsList from 'app/ConnectionsList';
import {reducer as attachments} from 'app/Attachments';

import library from 'app/Library/reducers/reducer';
import modals from 'app/Modals/reducers/modalsReducer';
import progress from 'app/Uploads/reducers/progressReducer';
import user from 'app/Auth/reducer';
import settings from 'app/Settings/reducers/reducer';
import login from 'app/Users/reducer';
import {reducer as metadata} from 'app/Metadata';
import locale from 'app/I18N/reducer';
import {multireducer} from 'app/Multireducer';

import {modelReducer, formReducer} from 'react-redux-form';
import prioritySortingCriteria from 'app/utils/prioritySortingCriteria';

const defaultSearch = prioritySortingCriteria.get();
defaultSearch.searchTerm = '';
defaultSearch.filters = {};

export default combineReducers({
  notifications: notificationsReducer,
  library: multireducer(library, 'library'),
  uploads: multireducer(library, 'uploads'),
  progress,
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
  connectionsList: ConnectionsList.reducer,
  attachments,
  modals,
  user,
  login,
  settings,
  metadata,
  search: modelReducer('search', defaultSearch),
  searchForm: formReducer('search')
});
