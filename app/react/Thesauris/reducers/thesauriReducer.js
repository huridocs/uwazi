import Immutable from 'immutable';

import * as types from 'app/Thesauris/actions/actionTypes';

const initialState = {name: '', values: []};

export default function fields(state = initialState, action = {}) {
  if (action.type === types.EDIT_THESAURI) {
    return Immutable.fromJS(action.thesauri);
  }

  if (action.type === types.RESET_THESAURI) {
    return Immutable.fromJS(initialState);
  }

  return Immutable.fromJS(state);
}
