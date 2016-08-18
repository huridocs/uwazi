import {combineReducers} from 'redux';
import createReducer from 'app/BasicReducer';

import template from 'app/Templates/reducers/reducer';
import {reducer as notificationsReducer} from 'app/Notifications';

import thesauri from 'app/Thesauris/reducers/reducer';
import documentViewer from 'app/Viewer/reducers/reducer';
import entityView from 'app/Entities/reducers/reducer';
import contextMenu from 'app/ContextMenu/reducers/contextMenuReducer';

import library from 'app/Library/reducers/reducer';
import modals from 'app/Modals/reducers/modalsReducer';
import uploads from 'app/Uploads/reducers/reducer';
import user from 'app/Auth/reducer';
import settings from 'app/Settings/reducer';
import login from 'app/Users/reducer';

import {modelReducer, formReducer} from 'react-redux-form';

export default combineReducers({
  notifications: notificationsReducer,
  library,
  template,
  thesauri,
  entityView,
  thesauris: createReducer('thesauris', []),
  relationTypes: createReducer('relationTypes', []),
  relationType: modelReducer('relationType', {name: ''}),
  relationTypeForm: formReducer('relationType'),
  templates: createReducer('templates', []),
  documentViewer,
  contextMenu,
  modals,
  uploads,
  user,
  login,
  settings,
  search: modelReducer('search', {sort: 'creationDate', order: 'desc', searchTerm: '', filters: {}})
});
