import Immutable from 'immutable';
const initialState = Immutable.fromJS([]);
import * as types from './actionTypes';

export default function fields(state = initialState, action = {}) {
  if (action.type === types.ADD_FIELD) {
    return state.push(Immutable.fromJS(action.config));
  }

  if (action.type === types.REMOVE_FIELD) {
    return state.delete(action.index);
  }

  return state;
}
