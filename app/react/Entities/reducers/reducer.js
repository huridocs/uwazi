import {combineReducers} from 'redux';
import createReducer from 'app/BasicReducer';
import {modelReducer, formReducer} from 'react-redux-form';

import {manageAttachmentsReducer} from 'app/Attachments';
import uiState from './uiReducer';

export default combineReducers({
  entity: manageAttachmentsReducer(createReducer('entityView/entity', {})),
  entityForm: modelReducer('entityView.entityForm'),
  entityFormState: formReducer('entityView.entityForm'),
  connection: createReducer('entityView/connection', {}),
  uiState
});
