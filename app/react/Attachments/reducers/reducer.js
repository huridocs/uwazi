import { combineReducers } from 'redux';
import { modelReducer, formReducer } from 'react-redux-form';
import { documents as progress } from './progressReducer.js';

const reducer = combineReducers({
  progress,
  edit: combineReducers({
    attachment: modelReducer('attachments.edit.attachment'),
    form: formReducer('attachments.edit.attachment'),
  }),
});

export { reducer };
