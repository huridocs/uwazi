import Immutable from 'immutable';

import * as types from 'app/Library/actions/actionTypes';

const initialState = {templates: [], properties: [], allDocumentTypes: false, documentTypes: {}};

export default function filters(state = initialState, action = {}) {
  if (action.type === types.SET_LIBRARY_TEMPLATES) {
    return state.set('templates', Immutable.fromJS(action.templates))
    .set('thesauris', Immutable.fromJS(action.thesauris))
    .set('documentTypes', Immutable.fromJS(action.documentTypes))
    .set('properties', Immutable.fromJS(action.libraryFilters))
    .set('allDocumentTypes', false);
  }

  if (action.type === types.SET_LIBRARY_FILTERS) {
    return state.set('documentTypes', Immutable.fromJS(action.documentTypes))
    .set('properties', Immutable.fromJS(action.libraryFilters))
    .set('allDocumentTypes', Object.keys(action.documentTypes).reduce((result, key) => {
      return result && action.documentTypes[key];
    }, true));
  }

  return Immutable.fromJS(state);
}
