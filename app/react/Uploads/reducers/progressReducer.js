import Immutable from 'immutable';

import * as types from 'app/Uploads/actions/actionTypes';

const initialState = { batch: {} };

const documents = (state = initialState, action = {}) => {
  if (action.type === types.NEW_UPLOAD_DOCUMENT) {
    return state.set(action.doc, 0);
  }

  if (action.type === types.UPLOAD_PROGRESS) {
    return state.set(action.doc, action.progress);
  }
  if (action.type === types.UPLOAD_COMPLETE) {
    return state.delete(action.doc);
  }

  if (action.type === types.BATCH_UPLOAD_START) {
    return state.setIn(['batch', action.sharedId], true);
  }
  if (action.type === types.BATCH_UPLOAD_COMPLETE) {
    return state.deleteIn(['batch', action.sharedId]);
  }

  return Immutable.fromJS(state);
};

export default documents;
