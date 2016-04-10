import Immutable from 'immutable';
import * as types from 'app/Viewer/actions/actionTypes';

const initialState = Immutable.fromJS([]);

export default function referencesReducer(state = initialState, action = {}) {

  if (action.type === types.SET_REFERENCES) {
    return Immutable.fromJS(action.references);
  }

  if (action.type === types.RESET_DOCUMENT_VIEWER) {
    return initialState;
  }

  return state;
}
