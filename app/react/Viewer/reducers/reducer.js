import {combineReducers} from 'redux';

import references from './referencesReducer';
import uiState from './uiReducer';

import createReducer from 'app/BasicReducer';
import {modelReducer, formReducer} from 'react-redux-form';


export default combineReducers({
  doc: createReducer('viewer/doc', {}),
  docHTML: createReducer('viewer/docHTML', {pages: []}),
  targetDoc: createReducer('viewer/targetDoc', {}),
  targetDocHTML: createReducer('viewer/targetDocHTML', {pages: []}),
  references,
  uiState,
  docForm: modelReducer('documentViewer.docForm'),
  docFormState: formReducer('documentViewer.docForm'),
  results: createReducer('viewer/documentResults', []),
  templates: createReducer('viewer/templates', []),
  thesauris: createReducer('viewer/thesauris', [])
});
