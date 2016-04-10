import Immutable from 'immutable';

import * as actions from 'app/ContextMenu/actions/actionTypes';


const initialState = Immutable.fromJS({open: false, menu: null});

export default function contextMenuReducer(state = initialState, action = {}) {
  if (action.type === actions.OPEN_MENU) {
    return state.set('open', true);
  }

  if (action.type === actions.CLOSE_MENU) {
    return state.set('open', false);
  }

  return state;
}
