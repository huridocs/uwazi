/** @format */
import createReducer from 'app/BasicReducer';
import { formReducer, modelReducer } from 'react-redux-form';
import { combineReducers } from 'redux';
import ID from 'shared/uniqueID';

export default combineReducers({
  models: createReducer('thesauri/models', []),
  thesaurus: createReducer('thesauri/thesaurus', {}),
  data: modelReducer('thesauri.data', { name: '', values: [{ label: '', id: ID() }] }),
  formState: formReducer('thesauri.data', { name: '', values: [{ label: '', id: ID() }] }),
});
