import Immutable from 'immutable';

import * as types from 'app/Library/actions/actionTypes';

const initialState = {properties: [], documentTypes: []};

export default function filters(state = initialState, action = {}) {
  if (action.type === types.SET_LIBRARY_FILTERS) {
    return state.set('documentTypes', Immutable.fromJS(action.documentTypes))
    .set('properties', Immutable.fromJS(action.libraryFilters));
  }

  if (action.type === types.UPDATE_LIBRARY_FILTERS) {
    return state.set('properties', Immutable.fromJS(action.libraryFilters));
  }

  return Immutable.fromJS(state);
}
