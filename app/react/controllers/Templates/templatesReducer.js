//import Immutable from 'immutable';
import * as types from './actionTypes';

const initialState = [];

export default function templates(state = initialState, action = {}) {

  if (action.type === types.LIST_TEMPLATES) {
    console.log(action.templates);
    return action.templates;
  }

  return state;
}
