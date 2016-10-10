import * as types from '../actions/actionTypes';
import {fromJS} from 'immutable';

const initialState = {relationType: ''};

export default function (state = initialState, action = {}) {
  if (action.type === types.OPEN_CONNECTION_PANEL) {
    let newState = fromJS(initialState);
    newState = newState.set('sourceDocument', action.sourceDocument);
    return newState.set('type', action.connectionType);
  }

  if (action.type === types.SET_RELATION_TYPE) {
    return state.set('relationType', action.relationType);
  }

  if (action.type === types.SET_TARGET_DOCUMENT) {
    return state.set('targetDocument', action.id);
  }

  if (action.type === 'connections/searchResults/SET') {
    let targetInResults = action.value.find(v => v._id === state.get('targetDocument'));
    if (!targetInResults) {
      return state.delete('targetDocument');
    }
    return state;
  }

  return fromJS(state);
}
