import {combineReducers} from 'redux';

import createReducer from 'app/BasicReducer';
import {modelReducer, formReducer} from 'react-redux-form';

import {addAttachmentsReducer} from 'app/Attachments';
import references from './referencesReducer';
import uiState from './uiReducer';

export default combineReducers({
  doc: addAttachmentsReducer(createReducer('viewer/doc', {})),
  targetDoc: createReducer('viewer/targetDoc', {}),
  targetDocReferences: createReducer('viewer/targetDocReferences', []),
  references,
  uiState,
  relationTypes: createReducer('viewer/relationTypes', []),
  tocForm: modelReducer('documentViewer.tocForm', []),
  tocFormState: formReducer('documentViewer.tocForm'),
  tocBeingEdited: createReducer('documentViewer/tocBeingEdited', false),
  sidepanel: combineReducers({
    metadata: modelReducer('documentViewer.sidepanel.metadata'),
    metadataForm: formReducer('documentViewer.sidepanel.metadata'),
    tab: createReducer('viewer.sidepanel.tab', '')
  })
});
