import Immutable from 'immutable';

import * as types from 'app/Uploads/actions/actionTypes';

const initialState = [];

export default function documents(state = initialState, action = {}) {
  if (action.type === types.SET_UPLOADS) {
    return Immutable.fromJS(action.documents);
  }

  return Immutable.fromJS(state);
}
