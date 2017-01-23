import {combineReducers} from 'redux';
import {modelReducer, formReducer} from 'react-redux-form';

export default combineReducers({
  data: modelReducer('thesauri.data', {name: '', values: []}),
  formState: formReducer('thesauri.data', {name: '', values: []})
});
