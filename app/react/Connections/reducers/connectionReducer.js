import { fromJS } from 'immutable';

import * as viewerTypes from 'app/Viewer/actions/actionTypes';

import * as types from '../actions/actionTypes';

const initialState = { template: '', targetDocument: '', sourceDocument: '' };

const resetState = (state) => {
  const propertiesToReset = ['template', 'targetDocument', 'sourceDocument'];
  const newState = state.toJS();
  propertiesToReset.forEach((key) => {
    newState[key] = '';
  });
  return fromJS(newState);
};

export default function (state = initialState, action = {}) {
  let newState;

  switch (action.type) {
  case types.OPEN_CONNECTION_PANEL:
    newState = resetState(state.set('type', action.connectionType));
    return newState.set('sourceDocument', action.sourceDocument);

  case types.SET_RELATION_TYPE:
    return state.set('template', action.template);

  case types.SET_TARGET_DOCUMENT:
    return state.set('targetDocument', action.id);

  case 'connections/searchResults/SET':
    if (!action.value.find(v => v.sharedId === state.get('targetDocument'))) {
      return state.delete('targetDocument');
    }
    return state;

  case viewerTypes.SET_SELECTION:
    return state.set('sourceRange', action.sourceRange);

  case viewerTypes.UNSET_SELECTION:
  case types.CONNECTION_CREATED:
    return state.delete('sourceRange');

  default:
    return fromJS(state);
  }
}
