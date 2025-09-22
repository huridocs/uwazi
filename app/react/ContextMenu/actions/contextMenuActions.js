import * as types from '../../ContextMenu/actions/actionTypes.js';

export function openMenu() {
  return {
    type: types.OPEN_MENU,
  };
}

export function closeMenu() {
  return {
    type: types.CLOSE_MENU,
  };
}
