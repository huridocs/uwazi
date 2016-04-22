import Immutable from 'immutable';

import * as types from 'app/Library/actions/actionTypes';

const initialState = {templates: [], docTypes: []};

export default function ui(state = initialState, action = {}) {
  if (action.type === types.SET_TEMPLATES) {
    return state.set('templates', action.templates).set('allTypes', true);
  }

  return Immutable.fromJS(state);
}
