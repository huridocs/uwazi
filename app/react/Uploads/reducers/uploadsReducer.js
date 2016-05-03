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

  if (action.type === types.UPDATE_DOCUMENT) {
    return state.update(state.findIndex(doc => doc.get('_id') === action.doc._id), (doc) => doc.merge(Immutable.fromJS(action.doc)));
  }

  if (action.type === types.CONVERSION_COMPLETE) {
    return state.update(state.findIndex(doc => doc.get('_id') === action.doc), (doc) => doc.set('processed', true));
  }

  return Immutable.fromJS(state);
}
