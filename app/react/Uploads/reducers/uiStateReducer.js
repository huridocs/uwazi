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

  if (action.type === types.SHOW_ENTITY_FORM) {
    return state.set('showEntityForm', true);
  }

  if (action.type === types.FINISH_EDIT_ENTITY) {
    return state.set('showEntityForm', false);
  }

  return Immutable.fromJS(state);
}
