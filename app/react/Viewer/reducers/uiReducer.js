import Immutable from 'immutable';
import * as types from 'app/Viewer/actions/actionTypes';

const initialState = {reference: {}};

export default function (state = initialState, action = {}) {
  if (action.type === types.HIGHLIGHT_REFERENCE) {
    return state.set('highlightedReference', action.reference);
  }

  if (action.type === types.OPEN_REFERENCE_PANEL) {
    return state.set('panel', 'referencePanel');
  }

  if (action.type === types.OPEN_TARGET_REFERENCE_PANEL) {
    return state.set('panel', 'targetReferencePanel');
  }

  if (action.type === types.VIEWER_SEARCHING) {
    return state.set('viewerSearching', true);
  }

  if (action.type === types.RESET_REFERENCE_CREATION) {
    return state.set('reference', Immutable.fromJS({}));
  }

  if (action.type === types.SET_SELECTION) {
    return state.setIn(['reference', 'sourceRange'], action.sourceRange);
  }

  if (action.type === types.SET_TARGET_SELECTION) {
    return state.setIn(['reference', 'targetRange'], action.targetRange);
  }

  if (action.type === types.UNSET_TARGET_SELECTION) {
    return state.setIn(['reference', 'targetRange'], null);
  }

  if (action.type === types.UNSET_SELECTION) {
    return state.setIn(['reference', 'sourceRange'], null).set('panel', false);
  }

  if (action.type === types.SET_TARGET_DOCUMENT) {
    return state.set('panel', false);
  }

  if (action.type === types.ADD_CREATED_REFERENCE) {
    return state.set('reference', Immutable.fromJS({})).set('panel', false);
  }

  if (action.type === types.SET_VIEWER_RESULTS) {
    let newState = state;
    let selectedInResults = action.results.find((result) => result._id === state.getIn(['reference', 'targetDocument']));
    if (!selectedInResults) {
      newState = state.deleteIn(['reference', 'targetDocument']);
    }
    return newState.set('viewerSearching', false);
  }

  if (action.type === types.SELECT_TARGET_DOCUMENT) {
    return state.setIn(['reference', 'targetDocument'], action.id);
  }

  if (action.type === types.RESET_DOCUMENT_VIEWER) {
    return Immutable.fromJS(initialState);
  }

  return Immutable.fromJS(state);
}
