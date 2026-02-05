import Immutable from '#shared/immutableWrapper.js';

import * as types from '#app/Library/actions/actionTypes.js';

const initialState = { properties: [], documentTypes: [] };

export default function filters(state = initialState, action = {}) {
  if (action.type === types.SET_LIBRARY_FILTERS || action.type === types.INITIALIZE_FILTERS_FORM) {
    return state
      .set('documentTypes', Immutable.fromJS(action.documentTypes))
      .set('properties', Immutable.fromJS(action.libraryFilters));
  }

  if (action.type === types.UPDATE_LIBRARY_FILTERS) {
    return state.set('properties', Immutable.fromJS(action.libraryFilters));
  }

  return Immutable.fromJS(state);
}
