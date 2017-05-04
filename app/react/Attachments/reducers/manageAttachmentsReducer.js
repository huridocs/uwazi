import {fromJS as Immutable} from 'immutable';
import * as attachmentsTypes from 'app/Attachments/actions/actionTypes';

export default function manageAttachmentsReducer(originalReducer) {
  return (state = {}, action = {}) => {
    if (action.type === attachmentsTypes.ATTACHMENT_COMPLETE && state.get('_id') === action.entity) {
      const attachments = state.get('attachments') || Immutable([]);
      return state.set('attachments', attachments.push(Immutable(action.file)));
    }

    if (action.type === attachmentsTypes.ATTACHMENT_DELETED && state.get('_id') === action.entity) {
      const attachments = state.get('attachments') || Immutable([]);
      return state.set('attachments', attachments.filterNot(a => a.get('filename') === action.file.filename));
    }

    if (action.type === attachmentsTypes.ATTACHMENT_RENAMED && state.get('_id') === action.entity) {
      if (state.get('_id') === action.file._id) {
        return state.setIn(['file', 'originalname'], action.file.originalname);
      }

      const attachments = state.get('attachments') || Immutable([]);
      return state.set('attachments', attachments.map(a => {
        if (a.get('_id') === action.file._id) {
          return a.set('originalname', action.file.originalname);
        }

        return a;
      }));
    }

    return originalReducer(state, action);
  };
}
