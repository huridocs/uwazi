// TEST!!!
import {fromJS as Immutable} from 'immutable';
import createReducer from 'app/BasicReducer';
import * as attachmentsTypes from 'app/Attachments/actions/actionTypes';

const reducer = createReducer('viewer/doc', {});

export default function docReducer(state = {}, action = {}) {
  if (action.type === attachmentsTypes.ATTACHMENT_COMPLETE && state.get('_id') === action.entity) {
    const attachments = state.get('attachments') || Immutable([]);
    return state.set('attachments', attachments.push(action.file));
  }

  return reducer(state, action);
}
