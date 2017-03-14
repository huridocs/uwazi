import * as types from 'app/Entities/actions/actionTypes';

export function showTab(tab) {
  return {
    type: types.SHOW_TAB,
    tab
  };
}
