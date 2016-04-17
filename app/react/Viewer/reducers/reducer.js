import {combineReducers} from 'redux';

import document from 'app/Viewer/reducers/documentReducer';
import references from 'app/Viewer/reducers/referencesReducer';
import uiState from 'app/Viewer/reducers/uiReducer';
import results from 'app/Viewer/reducers/resultsReducer';
import targetDocument from 'app/Viewer/reducers/targetDocumentReducer';

export default combineReducers({
  document,
  targetDocument,
  references,
  uiState,
  results
});
