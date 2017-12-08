import * as types from '../actions/actionTypes';
import {fromJS} from 'immutable';

const initialState = {hubIndex: null, rightRelationshipIndex: null};

export default function (state = initialState, action = {}) {
  switch (action.type) {

  case types.EDIT_RELATIONSHIPS_GROUP:
    return state.set('hubIndex', action.index).set('rightRelationshipIndex', action.rightIndex);

  default:
    return fromJS(state);
  }
}
