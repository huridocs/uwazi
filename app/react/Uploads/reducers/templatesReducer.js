import Immutable from 'immutable';

import * as types from 'app/Uploads/actions/actionTypes';

const initialState = [];

export default function templates(state = initialState, action = {}) {
  if (action.type === types.SET_TEMPLATES_UPLOADS) {
    return Immutable.fromJS(action.templates);
  }

  return Immutable.fromJS(state);
}
