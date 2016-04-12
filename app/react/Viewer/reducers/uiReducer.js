import Immutable from 'immutable';
import * as types from 'app/Viewer/actions/actionTypes';

const initialState = Immutable.fromJS({});

export default function (state = initialState, action = {}) {
  if (action.type === types.OPEN_REFERENCE_PANEL) {
    return state.set('referencePanel', true);
  }

  if (action.type === types.VIEWER_SEARCHING) {
    return state.set('viewerSearching', true);
  }

  if (action.type === types.SET_VIEWER_RESULTS) {
    return state.set('viewerSearching', false);
  }

  if (action.type === types.UNSET_SELECTION) {
    return state.set('referencePanel', false);
  }

  if (action.type === types.SELECT_TARGET_DOCUMENT) {
    return state.set('targetDocument', action.id);
  }

  return state;
}
