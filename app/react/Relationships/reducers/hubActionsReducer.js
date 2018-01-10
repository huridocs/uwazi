import * as types from '../actions/actionTypes';
import {fromJS} from 'immutable';

const initialState = {saving: false};

export default function (state = initialState, action = {}) {
  switch (action.type) {

  case types.SAVING_RELATIONSHIPS:
    console.log('Saving...');
    return state.set('saving', true);

  default:
    return fromJS(state);
  }
}
