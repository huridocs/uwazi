import Immutable from 'immutable';

import * as types from 'app/Uploads/actions/actionTypes';

const initialState = {};

export default function uiState(state = initialState, action = {}) {
  if (action.type === types.EDIT_UPLOADED_DOCUMENT) {
    return state.set('documentBeingEdited', action.doc._id);
  }

  if (action.type === types.FINISH_UPLOADED_DOCUMENT_EDIT) {
    return state.delete('documentBeingEdited');
  }

  return Immutable.fromJS(state);
}
