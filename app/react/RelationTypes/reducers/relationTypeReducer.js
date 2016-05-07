import Immutable from 'immutable';

import * as types from 'app/RelationTypes/actions/actionTypes';

const initialState = {name: ''};

export default function fields(state = initialState, action = {}) {
  if (action.type === types.EDIT_RELATION_TYPE) {
    return Immutable.fromJS(action.relationType);
  }

  if (action.type === types.RESET_RELATION_TYPE) {
    return Immutable.fromJS(initialState);
  }

  return Immutable.fromJS(state);
}
