import * as types from 'app/Viewer/actions/actionTypes';

const initialState = {pages: [], css: []};

export default function targetDocumentReducer(state = initialState, action = {}) {
  if (action.type === types.SET_TARGET_DOCUMENT) {
    return action.document;
  }

  if (action.type === types.RESET_DOCUMENT_VIEWER
    || action.type === types.RESET_REFERENCE_CREATION
    || action.type === types.ADD_CREATED_REFERENCE) {
    return initialState;
  }

  return state;
}
