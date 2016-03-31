import Immutable from 'immutable';
import * as types from './actionTypes';

const initialState = Immutable.fromJS([]);

export default function templates(state = initialState, action = {}) {
  if (action.type === types.SET_TEMPLATES) {
    return Immutable.fromJS(action.templates);
  }

  return state;
}
