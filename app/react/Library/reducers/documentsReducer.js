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

  return Immutable.fromJS(state);
}
