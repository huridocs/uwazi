import {combineReducers} from 'redux';
import createReducer from 'app/BasicReducer';
import {modelReducer, formReducer} from 'react-redux-form';

import {addAttachmentsReducer} from 'app/Attachments';
import uiState from './uiReducer';

import prioritySortingCriteria from 'app/utils/prioritySortingCriteria';

export default combineReducers({
  entity: addAttachmentsReducer(createReducer('entityView/entity', {})),
  entityForm: modelReducer('entityView.entityForm'),
  entityFormState: formReducer('entityView.entityForm'),
  references: createReducer('entityView/references', []),
  sort: modelReducer('entityView.sort', prioritySortingCriteria()),
  uiState
});
