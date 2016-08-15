import Immutable from 'immutable';

import * as types from 'app/Uploads/actions/actionTypes';

const initialState = {};

export default function uiState(state = initialState, action = {}) {
  if (action.type === types.EDIT_METADATA) {
    return state.set('metadataBeingEdited', action.doc);
  }

  if (action.type === types.FINISH_EDIT_METADATA) {
    return state.delete('metadataBeingEdited');
  }

  return Immutable.fromJS(state);
}
