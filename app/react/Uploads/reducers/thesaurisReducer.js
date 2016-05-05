import Immutable from 'immutable';

import * as types from 'app/Uploads/actions/actionTypes';

const initialState = [];

export default function thesauris(state = initialState, action = {}) {
  if (action.type === types.SET_THESAURIS_UPLOADS) {
    return Immutable.fromJS(action.thesauris);
  }

  return Immutable.fromJS(state);
}
