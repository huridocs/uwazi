import Immutable from 'immutable';

import * as types from 'app/RelationTypes/actions/actionTypes';

const initialState = [];

export default function fields(state = initialState, action = {}) {
  if (action.type === types.SET_RELATION_TYPES) {
    return Immutable.fromJS(action.relationTypes);
  }

  if (action.type === types.RELATION_TYPE_DELETED) {
    return state.filter((relationType) => relationType.get('_id') !== action.id);
  }

  return Immutable.fromJS(state);
}
