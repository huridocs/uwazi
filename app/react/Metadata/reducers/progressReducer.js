import Immutable from 'immutable';

import * as types from 'app/Metadata/actions/actionTypes';

const initialState = {};

export default function documents(state = initialState, action = {}) {
  if (action.type === types.START_REUPLOAD_DOCUMENT) {
    return state.set(action.doc, 0);
  }

  if (action.type === types.REUPLOAD_PROGRESS) {
    return state.set(action.doc, action.progress);
  }

  if (action.type === types.REUPLOAD_COMPLETE) {
    return state.delete(action.doc);
  }

  return Immutable.fromJS(state);
}
