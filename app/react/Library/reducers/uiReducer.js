import Immutable from 'immutable';

import * as types from 'app/Library/actions/actionTypes';

const initialState = Immutable.fromJS({
  searchTerm: '',
  previewDoc: '',
  suggestions: [],
  selectedDocuments: [],
  filtersPanel: false,
  zoomLevel: 0,
});

export default function ui(state = initialState, action = {}) {
  if (action.type === types.SET_SEARCHTERM) {
    let newState = state.set('searchTerm', action.searchTerm);
    if (!action.searchTerm) {
      newState = newState.set('suggestions', []);
    }
    return newState;
  }

  if (action.type === types.SELECT_DOCUMENT) {
    const alreadySelected = state
      .get('selectedDocuments')
      .filter(doc => doc.get('_id') === action.doc._id).size;
    if (!alreadySelected) {
      return state.update('selectedDocuments', selectedDocuments =>
        selectedDocuments.push(Immutable.fromJS(action.doc))
      );
    }

    return state;
  }

  if (action.type === types.SELECT_SINGLE_DOCUMENT) {
    const doc = Immutable.fromJS(action.doc);
    return state.update('selectedDocuments', () => Immutable.fromJS([doc]));
  }

  if (action.type === types.SELECT_DOCUMENTS) {
    return action.docs.reduce((_state, doc) => {
      const alreadySelected = _state
        .get('selectedDocuments')
        .filter(_doc => _doc.get('_id') === doc._id).size;
      if (!alreadySelected) {
        return _state.update('selectedDocuments', selectedDocuments =>
          selectedDocuments.push(Immutable.fromJS(doc))
        );
      }
      return _state;
    }, state);
  }

  if (action.type === types.UNSELECT_DOCUMENT) {
    return state.update('selectedDocuments', selectedDocuments =>
      selectedDocuments.filter(doc => doc.get('_id') !== action.docId)
    );
  }

  if (action.type === types.UNSELECT_ALL_DOCUMENTS) {
    return state.set('selectedDocuments', Immutable.fromJS([]));
  }

  if (action.type === types.UPDATE_SELECTED_ENTITIES) {
    return state.set('selectedDocuments', action.entities);
  }

  if (action.type === types.HIDE_FILTERS) {
    return state.set('filtersPanel', false);
  }

  if (action.type === types.SHOW_FILTERS) {
    return state.set('filtersPanel', true);
  }

  if (action.type === types.SET_PREVIEW_DOC) {
    return state.set('previewDoc', action.docId);
  }

  if (action.type === types.SET_SUGGESTIONS) {
    return state.set('suggestions', Immutable.fromJS(action.suggestions));
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

  if (action.type === types.ZOOM_IN) {
    const maxLevel = 3;
    return state.set('zoomLevel', Math.min(state.get('zoomLevel') + 1, maxLevel));
  }

  if (action.type === types.ZOOM_OUT) {
    const minLevel = -3;
    return state.set('zoomLevel', Math.max(state.get('zoomLevel') - 1, minLevel));
  }

  return Immutable.fromJS(state);
}
