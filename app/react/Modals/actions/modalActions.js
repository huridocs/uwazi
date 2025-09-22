import * as types from '../../Modals/actions/actionTypes.js';

export function showModal(modal, data) {
  return {
    type: types.SHOW_MODAL,
    modal,
    data,
  };
}

export function hideModal(modal) {
  return {
    type: types.HIDE_MODAL,
    modal,
  };
}
