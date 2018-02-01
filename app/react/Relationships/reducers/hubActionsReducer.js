import * as types from '../actions/actionTypes';
import {fromJS} from 'immutable';

const initialState = {editing: false, saving: false, addTo: {hubIndex: null, rightRelationshipIndex: null}};

export default function (state = initialState, action = {}) {
  switch (action.type) {

  case types.EDIT_RELATIONSHIPS:
    return state.set('editing', action.value);

  case types.SET_RELATIONSHIPS_ADD_TO_DATA:
    return state.setIn(['addTo', 'hubIndex'], action.index).setIn(['addTo', 'rightRelationshipIndex'], action.rightIndex);

  case types.SAVING_RELATIONSHIPS:
    return state.set('saving', true);

  case types.SAVED_RELATIONSHIPS:
    return state.set('saving', false);

  default:
    return fromJS(state);
  }
}
