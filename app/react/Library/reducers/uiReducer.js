import Immutable from 'immutable';

import * as types from 'app/Library/actions/actionTypes';

const initialState = {searchTerm: '', previewDoc: '', suggestions: []};

export default function ui(state = initialState, action = {}) {
  if (action.type === types.SET_SEARCHTERM) {
    return state.set('searchTerm', action.searchTerm);
  }

  if (action.type === types.SET_PREVIEW_DOC) {
    return state.set('previewDoc', action.docId);
  }

  if (action.type === types.SET_SUGGESTIONS) {
    return state.set('suggestions', action.suggestions);
  }

  if (action.type === types.SHOW_SUGGESTIONS) {
    return state.set('showSuggestions', true);
  }

  if (action.type === types.HIDE_SUGGESTIONS) {
    return state.set('showSuggestions', false);
  }

  return Immutable.fromJS(state);
}
