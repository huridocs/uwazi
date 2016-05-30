import {combineReducers} from 'redux';

import documents from './documentsReducer';
import libraryUI from './uiReducer';
import libraryFilters from './filtersReducer';

import {modelReducer, formReducer} from 'react-redux-form';

export default combineReducers({
  docForm: modelReducer('library.docForm'),
  docFormState: formReducer('library.docForm'),
  documents: documents,
  ui: libraryUI,
  filters: libraryFilters
});
