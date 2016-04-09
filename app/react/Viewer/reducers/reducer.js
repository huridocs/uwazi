import {combineReducers} from 'redux';

import document from 'app/Viewer/reducers/documentReducer';
import references from 'app/Viewer/reducers/referencesReducer';
import selection from 'app/Viewer/reducers/selectionReducer';

export default combineReducers({
  document,
  references,
  selection
});
