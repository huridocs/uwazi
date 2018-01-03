import {fromJS as Immutable} from 'immutable';
import * as types from '../actions/actionTypes';

const initialState = {open: false, connecting: false};

export default function (state = initialState, action = {}) {
  switch (action.type) {
  case types.OPEN_RELATIONSHIPS_PANEL:
    return state.set('open', true);

  case types.CLOSE_RELATIONSHIPS_PANEL:
    return state.set('open', false);

  case types.SEARCHING_RELATIONSHIPS:
    return state.set('searching', true);

  case 'relationships/searchResults/SET':
    return state.set('searching', false);

  default:
    return Immutable(state);
  }
}
