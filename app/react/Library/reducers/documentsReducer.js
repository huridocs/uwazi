import Immutable from 'immutable';

import * as types from 'app/Library/actions/actionTypes';

const initialState = [];

export default function documents(state = initialState, action = {}) {
  if (action.type === types.SET_DOCUMENTS) {
    return Immutable.fromJS(action.documents);
  }

  return Immutable.fromJS(state);
}
