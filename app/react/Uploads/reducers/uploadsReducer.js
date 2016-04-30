import Immutable from 'immutable';

import * as types from 'app/Uploads/actions/actionTypes';

const initialState = [];

export default function documents(state = initialState, action = {}) {
  if (action.type === types.SET_UPLOADS) {
    return Immutable.fromJS(action.documents);
  }

  if (action.type === types.NEW_UPLOAD_DOCUMENT) {
    return state.unshift(action.doc);
  }

  return Immutable.fromJS(state);
}
