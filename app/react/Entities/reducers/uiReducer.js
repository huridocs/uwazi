import Immutable from 'immutable';
import * as types from 'app/Entities/actions/actionTypes';

const initialState = {};

export default function (state = initialState, action = {}) {
  if (action.type === types.SHOW_TAB) {
    return state.set('tab', action.tab).set('showFilters', false);
  }

  if (action.type === types.HIDE_FILTERS) {
    return state.set('showFilters', false);
  }

  if (action.type === types.SHOW_FILTERS) {
    return state.set('tab', 'connections').set('showFilters', true);
  }

  return Immutable.fromJS(state);
}
