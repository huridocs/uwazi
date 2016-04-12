import * as types from 'app/Viewer/actions/actionTypes';

const initialState = [];

export default function template(state = initialState, action = {}) {
  if (action.type === types.SET_VIEWER_RESULTS) {
    return action.results;
  }

  return state;
}
