import Immutable from 'immutable';
import * as types from 'app/Viewer/actions/actionTypes';

const initialState = Immutable.fromJS({});

export default function (state = initialState, action = {}) {
  if (action.type === types.OPEN_REFERENCE_PANEL) {
    return state.set('referencePanel', true);
  }

  return state;
}
