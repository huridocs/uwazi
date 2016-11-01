import {fromJS as Immutable} from 'immutable';
import * as types from '../actions/actionTypes';

const initialState = {};

export default function documents(state = initialState, action = {}) {
  if (action.type === types.START_UPLOAD_ATTACHMENT) {
    return state.set(action.entity, 0);
  }

  if (action.type === types.ATTACHMENT_PROGRESS) {
    return state.set(action.entity, action.progress);
  }

  if (action.type === types.ATTACHMENT_COMPLETE) {
    return state.delete(action.entity);
  }

  return Immutable(state);
}
