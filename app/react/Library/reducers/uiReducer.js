import Immutable from 'immutable';

import * as types from 'app/Library/actions/actionTypes';

const initialState = {searchTerm: '', previewDoc: '', suggestions: []};

export default function ui(state = initialState, action = {}) {
  if (action.type === types.SET_SEARCHTERM) {
    let newState = state.set('searchTerm', action.searchTerm);
    if (!action.searchTerm) {
      newState = newState.set('suggestions', []);
    }
    return newState;
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

  if (action.type === types.OVER_SUGGESTIONS) {
    return state.set('overSuggestions', action.hover);
  }

  return Immutable.fromJS(state);
}
