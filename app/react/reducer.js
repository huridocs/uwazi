import {combineReducers} from 'redux';
import {reducer as reduxForm} from 'redux-form';

import templates from 'app/Templates/reducers/templatesReducer';
import template from 'app/Templates/reducers/reducer';
import {reducer as notificationsReducer} from 'app/Notifications';

import thesauri from 'app/Thesauris/reducers/thesauriReducer';
import thesauris from 'app/Thesauris/reducers/thesaurisReducer';
import relationTypes from 'app/RelationTypes/reducers/relationTypesReducer';
import documentViewer from 'app/Viewer/reducers/reducer';
import contextMenu from 'app/ContextMenu/reducers/contextMenuReducer';

import library from 'app/Library/reducers/reducer';
import modals from 'app/Modals/reducers/modalsReducer';
import uploads from 'app/Uploads/reducers/reducer';
import user from 'app/Auth/reducer';

import {modelReducer, formReducer} from 'react-redux-form';

export default combineReducers({
  notifications: notificationsReducer,
  form: reduxForm,
  library,
  template,
  thesauri,
  thesauris,
  relationTypes,
  relationType: modelReducer('relationType', {name: ''}),
  relationTypeForm: formReducer('relationType'),
  templates,
  documentViewer,
  contextMenu,
  modals,
  uploads,
  user,
  search: modelReducer('search', {sort: 'creationDate', order: 'desc', searchTerm: '', filters: {}})
});
