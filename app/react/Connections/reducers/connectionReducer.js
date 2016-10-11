import * as types from '../actions/actionTypes';
import * as viewerTypes from 'app/Viewer/actions/actionTypes';
import {fromJS} from 'immutable';

const initialState = {relationType: '', targetDocument: '', sourceDocument: ''};

const resetState = (state) => {
  const propertiesToReset = ['relationType', 'targetDocument', 'sourceDocument'];
  const newState = state.toJS();
  propertiesToReset.forEach(key => {
    newState[key] = '';
  });
  return fromJS(newState);
};

export default function (state = initialState, action = {}) {
  switch (action.type) {
  case types.OPEN_CONNECTION_PANEL:
    const newState = resetState(state.set('type', action.connectionType));
    return newState.set('sourceDocument', action.sourceDocument);

  case types.SET_RELATION_TYPE:
    return state.set('relationType', action.relationType);

  case types.SET_TARGET_DOCUMENT:
    return state.set('targetDocument', action.id);

  case 'connections/searchResults/SET':
    const targetInResults = action.value.find(v => v._id === state.get('targetDocument'));
    if (!targetInResults) {
      return state.delete('targetDocument');
    }
    return state;

  case viewerTypes.SET_SELECTION:
    return state.set('sourceRange', action.sourceRange);

  case viewerTypes.UNSET_SELECTION:
    return state.delete('sourceRange');

  default:
    return fromJS(state);
  }
}
