// TEST!
import Immutable from 'immutable';
import * as types from '../actions/actionTypes';

const initialState = {open: false};

export default function (state = initialState, action = {}) {
  switch (action.type) {
  case types.OPEN_CONNECTION_PANEL:
    return state.set('open', true);

  case types.CLOSE_CONNECTION_PANEL:
    return state.set('open', false);

  case types.SEARCHING_CONNECTIONS:
    return state.set('searching', true);

  case 'connections/searchResults/SET':
    return state.set('searching', false);

  case types.CREATING_CONNECTION:
    return state.set('creating', true);

  case types.CONNECTION_CREATED:
    let newState = state.set('open', false);
    return newState.set('creating', false);

  default:
    return Immutable.fromJS(state);
  }
}
