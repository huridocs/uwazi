import {combineReducers} from 'redux';
import createReducer from 'app/BasicReducer';
import {modelReducer, formReducer} from 'react-redux-form';

export default combineReducers({
  entity: createReducer('entityView/entity', {}),
  references: createReducer('entityView/references', []),
  entityForm: modelReducer('entityView.entityForm'),
  entityFormState: formReducer('entityView.entityForm')
});
