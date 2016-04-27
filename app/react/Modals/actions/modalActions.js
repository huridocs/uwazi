import * as types from 'app/Modals/actions/actionTypes';

export function showModal(modal, data) {
  return {
    type: types.SHOW_MODAL,
    modal,
    data
  };
}

export function hideModal(modal) {
  return {
    type: types.HIDE_MODAL,
    modal
  };
}
