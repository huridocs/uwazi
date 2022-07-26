import Immutable from 'immutable';

import * as types from 'app/Uploads/actions/actionTypes';

const initialState = {};

const documents = (state = initialState, action = {}) => {
  if (action.type === types.NEW_UPLOAD_DOCUMENT) {
    return state.set(action.doc, 0);
  }

  if (action.type === types.UPLOAD_PROGRESS) {
    const progress = action.progress === 100 ? 0 : action.progress;
    return state.set(action.doc, progress);
  }

  if ([types.UPLOAD_COMPLETE, types.BATCH_UPLOAD_COMPLETE].includes(action.type)) {
    return state.delete(action.doc);
  }

  return Immutable.fromJS(state);
};

export default documents;
