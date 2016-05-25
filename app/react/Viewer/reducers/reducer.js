import {combineReducers} from 'redux';

import document from './documentReducer';
import references from './referencesReducer';
import uiState from './uiReducer';
import targetDocument from './targetDocumentReducer';

import createReducer from 'app/BasicReducer';
import {modelReducer, formReducer} from 'react-redux-form';


export default combineReducers({
  document,
  targetDocument,
  references,
  uiState,
  docForm: modelReducer('documentViewer.docForm'),
  docFormState: formReducer('documentViewer.docForm'),
  results: createReducer('viewer/documentResults', []),
  templates: createReducer('viewer/templates', []),
  thesauris: createReducer('viewer/thesauris', [])
});
