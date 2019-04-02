import { combineReducers } from 'redux';
import { modelReducer, formReducer } from 'react-redux-form';
import ID from 'shared/uniqueID';

export default combineReducers({
  data: modelReducer('thesauri.data', { name: '', values: [{ label: '', id: ID() }] }),
  formState: formReducer('thesauri.data', { name: '', values: [{ label: '', id: ID() }] })
});
