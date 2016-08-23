import {combineReducers} from 'redux';
import createReducer from 'app/BasicReducer';

export default combineReducers({
  entity: createReducer('entityView/entity', {}),
  references: createReducer('entityView/references', [])
});
