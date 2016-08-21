import {combineReducers} from 'redux';

import documents from './documentsReducer';
import libraryUI from './uiReducer';
import libraryFilters from './filtersReducer';

import {modelReducer, formReducer} from 'react-redux-form';

export default combineReducers({
  metadata: modelReducer('library.metadata'),
  metadataForm: formReducer('library.metadata'),
  documents: documents,
  ui: libraryUI,
  filters: libraryFilters
});
