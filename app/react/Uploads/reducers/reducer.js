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
  metadata: modelReducer('uploads.metadata'),
  metadataForm: formReducer('uploads.metadata'),
  multipleEdit: modelReducer('uploads.multipleEdit'),
  multipleEditForm: formReducer('uploads.multipleEdit'),
  entity: modelReducer('uploads.entity'),
  entityForm: formReducer('uploads.entity')
});
