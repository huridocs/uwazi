import { combineReducers } from 'redux';
import { modelReducer, formReducer } from 'react-redux-form';
import progress from './progressReducer.js';

export default combineReducers({
  progress,
  edit: combineReducers({
    attachment: modelReducer('attachments.edit.attachment'),
    form: formReducer('attachments.edit.attachment'),
  }),
});
