import Immutable from 'immutable';
import * as types from 'app/Viewer/actions/actionTypes';

const initialState = {reference: {}};

export default function (state = initialState, action = {}) {
  if (action.type === types.OPEN_REFERENCE_PANEL) {
    return state.set('referencePanel', true);
  }

  if (action.type === types.VIEWER_SEARCHING) {
    return state.set('viewerSearching', true);
  }

  if (action.type === types.SET_SELECTION) {
    return state.setIn(['reference', 'sourceRange'], action.sourceRange);
  }

  if (action.type === types.UNSET_SELECTION) {
    return state.setIn(['reference', 'sourceRange'], null).set('referencePanel', false);
  }

  if (action.type === types.ADD_CREATED_REFERENCE) {
    return state.set('reference', Immutable.fromJS({})).set('referencePanel', false);
  }

  if (action.type === types.SET_VIEWER_RESULTS) {
    return state.set('viewerSearching', false);
  }

  if (action.type === types.SELECT_TARGET_DOCUMENT) {
    return state.setIn(['reference', 'targetDocument'], action.id);
  }

  if (action.type === types.RESET_DOCUMENT_VIEWER) {
    return Immutable.fromJS(initialState);
  }

  return Immutable.fromJS(state);
}
