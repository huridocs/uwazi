import * as types from 'app/Entities/actions/actionTypes';

export function showTab(tab) {
  return {
    type: types.SHOW_TAB,
    tab
  };
}

export function hideFilters() {
  return {type: types.HIDE_FILTERS};
}

export function showFilters() {
  return {type: types.SHOW_FILTERS};
}
