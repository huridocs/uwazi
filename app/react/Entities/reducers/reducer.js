import { combineReducers } from 'redux';
import { createReducer } from '#app/BasicReducer/index.js';
import { modelReducer, formReducer } from 'react-redux-form';

import { manageAttachmentsReducer } from '#app/Attachments/index.js';
import uiState from './uiReducer.js';

const reducer = combineReducers({
  entity: manageAttachmentsReducer(createReducer('entityView/entity', {})),
  entityForm: modelReducer('entityView.entityForm'),
  entityFormState: formReducer('entityView.entityForm'),
  uiState,
});

export { reducer };
