import {fromJS as Immutable} from 'immutable';
import * as attachmentsTypes from 'app/Attachments/actions/actionTypes';

export default function addAttachmentsReducer(originalReducer) {
  return (state = {}, action = {}) => {
    if (action.type === attachmentsTypes.ATTACHMENT_COMPLETE && state.get('_id') === action.entity) {
      const attachments = state.get('attachments') || Immutable([]);
      return state.set('attachments', attachments.push(Immutable(action.file)));
    }

    if (action.type === attachmentsTypes.ATTACHMENT_DELETED && state.get('_id') === action.entity) {
      const attachments = state.get('attachments') || Immutable([]);
      return state.set('attachments', attachments.filterNot(a => a.get('filename') === action.file.filename));
    }

    return originalReducer(state, action);
  };
}
