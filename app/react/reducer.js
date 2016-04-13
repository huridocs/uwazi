import {combineReducers} from 'redux';
import {reducer as formReducer} from 'redux-form';

import templates from 'app/Templates/reducers/templatesReducer';
import template from 'app/Templates/reducers/templateReducer';
import templateUI from 'app/Templates/reducers/uiReducer';
import {reducer as notificationsReducer} from 'app/Notifications';

import thesauri from 'app/Thesauris/reducers/thesauriReducer';
import thesauris from 'app/Thesauris/reducers/thesaurisReducer';
import documentViewer from 'app/Viewer/reducers/reducer';
import contextMenu from 'app/ContextMenu/reducers/contextMenuReducer';

import documents from 'app/Library/reducers/documentsReducer';
import libraryUI from 'app/Library/reducers/uiReducer';

export default combineReducers({
  notifications: notificationsReducer,
  form: formReducer,
  template: combineReducers({
    data: template,
    uiState: templateUI
  }),
  library: combineReducers({
    documents: documents,
    ui: libraryUI
  }),
  thesauri: thesauri,
  thesauris,
  templates,
  documentViewer,
  contextMenu
});
