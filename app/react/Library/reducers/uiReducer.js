import Immutable from 'immutable';

import * as types from 'app/Library/actions/actionTypes';

const initialState = {searchTerm: ''};

export default function ui(state = initialState, action = {}) {
  if (action.type === types.SET_SEARCHTERM) {
    return state.set('searchTerm', action.searchTerm);
  }

  return Immutable.fromJS(state);
}
