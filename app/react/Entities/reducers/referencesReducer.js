// TEST!!!
import * as connectionTypes from 'app/Connections/actions/actionTypes';
import createReducer from 'app/BasicReducer';
import {fromJS} from 'immutable';

const initialState = [];

export default function (state = initialState, action = {}) {
  if (action.type === connectionTypes.CONNECTION_CREATED) {
    return state.push(fromJS(action.connection));
  }

  return createReducer('entityView/references', [])(state, action);
}
