import Immutable from 'immutable';

import * as types from 'app/Uploads/actions/actionTypes';

const initialState = {};

export default function documents(state = initialState, action = {}) {
  if (action.type === types.UPLOAD_PROGRESS) {
    return state.set(action.doc, action.progress);
  }

  if (action.type === types.UPLOAD_COMPLETE) {
    return state.delete(action.doc);
  }

  return Immutable.fromJS(state);
}
