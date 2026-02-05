import Immutable from '#shared/immutableWrapper.js';
import * as types from '#app/Entities/actions/actionTypes.js';

export const initialState = { userSelectedTab: false };

const reducer = (state = initialState, action = {}) => {
  if (action.type === types.SHOW_TAB) {
    return state.set('tab', action.tab).set('userSelectedTab', true).set('showFilters', false);
  }

  if (action.type === types.RESET_USER_SELECTED_TAB) {
    return state.set('userSelectedTab', false);
  }

  if (action.type === types.HIDE_FILTERS) {
    return state.set('showFilters', false);
  }

  if (action.type === types.SHOW_FILTERS) {
    return state.set('tab', 'connections').set('showFilters', true);
  }

  return Immutable.fromJS(state);
};

export default reducer;
