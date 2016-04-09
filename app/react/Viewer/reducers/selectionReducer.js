import * as types from 'app/Viewer/actions/actionTypes';

const initialState = null;

export default function template(state = initialState, action = {}) {

  if (action.type === types.SET_SELECTION) {
    return action.selection;
  }

  if (action.type === types.UNSET_SELECTION) {
    return null;
  }

  return state;
}
