import {combineReducers} from 'redux';
import {reducer as reduxForm} from 'redux-form';

import templates from 'app/Templates/reducers/templatesReducer';
import template from 'app/Templates/reducers/templateReducer';
import templateUI from 'app/Templates/reducers/uiReducer';
import {reducer as notificationsReducer} from 'app/Notifications';

import thesauri from 'app/Thesauris/reducers/thesauriReducer';
import thesauris from 'app/Thesauris/reducers/thesaurisReducer';
import relationTypes from 'app/RelationTypes/reducers/relationTypesReducer';
import documentViewer from 'app/Viewer/reducers/reducer';
import contextMenu from 'app/ContextMenu/reducers/contextMenuReducer';

import documents from 'app/Library/reducers/documentsReducer';
import libraryUI from 'app/Library/reducers/uiReducer';
import libraryFilters from 'app/Library/reducers/filtersReducer';
import modals from 'app/Modals/reducers/modalsReducer';
import uploads from 'app/Uploads/reducers/reducer';

import {modelReducer, formReducer} from 'react-redux-form';

export default combineReducers({
  notifications: notificationsReducer,
  form: reduxForm,
  template: combineReducers({
    data: template,
    uiState: templateUI
  }),
  library: combineReducers({
    documents: documents,
    ui: libraryUI,
    filters: libraryFilters
  }),
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
  search: modelReducer('search', {sort: 'creationDate', order: 'desc', searchTerm: '', filters: {}})
});
