import Immutable from 'immutable';

import * as types from 'app/Library/actions/actionTypes';

const initialState = {rows: []};

export default function documents(state = initialState, action = {}) {
  if (action.type === types.SET_DOCUMENTS) {
    return Immutable.fromJS(action.documents);
  }

  if (action.type === types.UPDATE_DOCUMENT) {
    const docIndex = state.get('rows').findIndex(doc => {
      return doc.get('_id') === action.doc._id;
    });

    return state.setIn(['rows', docIndex], Immutable.fromJS(action.doc));
  }

  if (action.type === types.UPDATE_DOCUMENTS) {
    return action.docs.reduce((_state, doc) => {
      const docIndex = state.get('rows').findIndex(_doc => {
        return _doc.get('_id') === doc._id;
      });

      return _state.setIn(['rows', docIndex], Immutable.fromJS(doc));
    }, state);
  }

  if (action.type === types.REMOVE_DOCUMENT) {
    const docIndex = state.get('rows').findIndex(doc => {
      return doc.get('_id') === action.doc._id;
    });

    if (docIndex >= 0) {
      return state.deleteIn(['rows', docIndex]);
    }

    return state;
  }

  if (action.type === types.REMOVE_DOCUMENTS) {
    return action.docs.reduce((_state, doc) => {
      const docIndex = _state.get('rows').findIndex(_doc => {
        return _doc.get('_id') === doc._id;
      });

      if (docIndex >= 0) {
        return _state.deleteIn(['rows', docIndex]);
      }
      return _state;
    }, state);
  }

  return Immutable.fromJS(state);
}
