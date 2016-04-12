import {combineReducers} from 'redux';

import document from 'app/Viewer/reducers/documentReducer';
import references from 'app/Viewer/reducers/referencesReducer';
import selection from 'app/Viewer/reducers/selectionReducer';
import uiState from 'app/Viewer/reducers/uiReducer';
import results from 'app/Viewer/reducers/resultsReducer';

export default combineReducers({
  document,
  references,
  selection,
  uiState,
  results
});
