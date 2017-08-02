import {fromJS as Immutable} from 'immutable';
import * as attachmentsTypes from 'app/Attachments/actions/actionTypes';

const getId = (state, setInArray) => {
  return state.getIn(setInArray.concat(['_id']));
};

const getAttachments = (state, setInArray) => {
  return state.getIn(setInArray.concat(['attachments'])) || Immutable([]);
};

export default function manageAttachmentsReducer(originalReducer, {useDefaults = true, setInArray = []} = {}) {
  return (orignialState, originalAction) => {
    let state = orignialState;
    let action = originalAction || {};

    if (useDefaults) {
      state = orignialState || {};
    }

    if (action.type === attachmentsTypes.ATTACHMENT_COMPLETE && getId(state, setInArray) === action.entity) {
      const attachments = getAttachments(state, setInArray);
      return state.setIn(setInArray.concat(['attachments']), attachments.push(Immutable(action.file)));
    }

    if (action.type === attachmentsTypes.ATTACHMENT_DELETED && getId(state, setInArray) === action.entity) {
      const attachments = getAttachments(state, setInArray);
      return state.setIn(setInArray.concat(['attachments']), attachments.filterNot(a => a.get('filename') === action.file.filename));
    }

    if (action.type === attachmentsTypes.ATTACHMENT_RENAMED && getId(state, setInArray) === action.entity) {
      if (getId(state, setInArray) === action.file._id) {
        return state.setIn(setInArray.concat(['file', 'originalname']), action.file.originalname);
      }

      const attachments = getAttachments(state, setInArray);
      return state.setIn(setInArray.concat(['attachments']), attachments.map(a => {
        if (a.get('_id') === action.file._id) {
          return a.set('originalname', action.file.originalname);
        }

        return a;
      }));
    }

    return originalReducer(state, action);
  };
}
