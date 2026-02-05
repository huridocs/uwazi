import Immutable from '#shared/immutableWrapper.js';

import * as types from '#app/Modals/actions/actionTypes.js';

const initialState = {};

export default function modals(state = initialState, action = {}) {
  if (action.type === types.SHOW_MODAL) {
    return state.set(action.modal, action.data);
  }

  if (action.type === types.HIDE_MODAL) {
    return state.delete(action.modal);
  }

  return Immutable.fromJS(state);
}
