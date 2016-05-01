import Immutable from 'immutable';

import * as types from 'app/Uploads/actions/actionTypes';

const initialState = [];

export default function documents(state = initialState, action = {}) {
  if (action.type === types.SET_UPLOADS) {
    return Immutable.fromJS(action.documents);
  }

  if (action.type === types.NEW_UPLOAD_DOCUMENT) {
    return state.unshift(Immutable.fromJS(action.doc));
  }

  if (action.type === types.UPLOAD_COMPLETE) {
    return state.update(state.findIndex(doc => doc.get('_id') === action.doc), (doc) => doc.set('uploaded', true));
  }

  return Immutable.fromJS(state);
}
