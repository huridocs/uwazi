import {combineReducers} from 'redux';

import document from 'app/Viewer/reducers/documentReducer';
import references from 'app/Viewer/reducers/referencesReducer';
import uiState from 'app/Viewer/reducers/uiReducer';
import targetDocument from 'app/Viewer/reducers/targetDocumentReducer';

import createReducer from 'app/BasicReducer';

export default combineReducers({
  document,
  targetDocument,
  references,
  uiState,
  results: createReducer('viewer/documentResults', []),
  templates: createReducer('viewer/templates', []),
  thesauris: createReducer('viewer/thesauris', [])
});
