import {combineReducers} from 'redux';

import documents from 'app/Uploads/reducers/uploadsReducer';
import thesauris from 'app/Uploads/reducers/thesaurisReducer';
import templates from 'app/Uploads/reducers/templatesReducer';
import progress from 'app/Uploads/reducers/progressReducer';
import uiState from 'app/Uploads/reducers/uiStateReducer';
import {modelReducer, formReducer} from 'react-redux-form';

export default combineReducers({
  documents,
  templates,
  thesauris,
  progress,
  uiState,
  document: modelReducer('uploads.document'),
  documentForm: formReducer('uploads.document'),
  entity: modelReducer('uploads.entity', {title: '', template: ''}),
  entityForm: formReducer('uploads.entity')
});
