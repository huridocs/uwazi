// TEST!
import Immutable from 'immutable';
import * as types from 'app/Entities/actions/actionTypes';

const initialState = {};

export default function (state = initialState, action = {}) {
  if (action.type === types.SHOW_TAB) {
    return state.set('tab', action.tab);
  }

  return Immutable.fromJS(state);
}
