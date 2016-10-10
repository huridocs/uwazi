import {combineReducers} from 'redux';
import createReducer from 'app/BasicReducer';
import {modelReducer, formReducer} from 'react-redux-form';

import references from './referencesReducer';
import uiState from './uiReducer';

export default combineReducers({
  entity: createReducer('entityView/entity', {}),
  entityForm: modelReducer('entityView.entityForm'),
  entityFormState: formReducer('entityView.entityForm'),
  references,
  uiState
});
