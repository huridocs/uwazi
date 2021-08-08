import { combineReducers } from 'redux';

import createReducer from 'app/BasicReducer';
import { modelReducer, formReducer } from 'react-redux-form';

import { manageAttachmentsReducer } from 'app/Attachments';
import references from './referencesReducer';
import uiState from './uiReducer';

export default combineReducers({
  doc: manageAttachmentsReducer(createReducer('viewer/doc', {})),
  targetDoc: createReducer('viewer/targetDoc', {}),
  rawText: createReducer('viewer/rawText', ''),
  targetDocReferences: createReducer('viewer/targetDocReferences', []),
  references,
  uiState,
  relationTypes: createReducer('viewer/relationTypes', []),
  tocForm: modelReducer('documentViewer.tocForm', []),
  tocFormState: formReducer('documentViewer.tocForm'),
  tocBeingEdited: createReducer('documentViewer/tocBeingEdited', false),
  metadataExtraction: createReducer('documentViewer.metadataExtraction', {
    selections: [],
  }),
  sidepanel: combineReducers({
    metadata: modelReducer('documentViewer.sidepanel.metadata'),
    metadataForm: formReducer('documentViewer.sidepanel.metadata'),
    snippets: createReducer('documentViewer.sidepanel.snippets', {
      count: 0,
      metadata: [],
      fullText: [],
    }),
    tab: createReducer('viewer.sidepanel.tab', ''),
  }),
});
