import * as types from 'app/Viewer/actions/actionTypes';

const initialState = {pages: [], css: []};

export default function targetDocumentReducer(state = initialState, action = {}) {
  if (action.type === types.SET_TARGET_DOCUMENT) {
    return Object.assign({}, action.html, action.document);
  }

  if (action.type === types.ADD_REFERENCE) {
    return initialState;
  }

  return state;
}
