import Immutable from 'immutable';

import * as types from 'app/Library/actions/actionTypes';
import {libraryFilters, generateDocumentTypes} from 'app/Library/helpers/libraryFilters';

const initialState = {templates: [], properties: [], allDocumentTypes: true};

export default function filters(state = initialState, action = {}) {
  if (action.type === types.SET_TEMPLATES) {
    let documentTypes = generateDocumentTypes(action.templates);
    return state.set('templates', Immutable.fromJS(action.templates))
    .set('thesauris', Immutable.fromJS(action.thesauris))
    .set('documentTypes', Immutable.fromJS(documentTypes))
    .set('properties', libraryFilters(action.templates, documentTypes, action.thesauris))
    .set('allDocumentTypes', true);
  }

  if (action.type === types.TOGGLE_FILTER_DOCUMENT_TYPE) {
    let path = ['documentTypes', action.documentType];
    let newState = state.setIn(path, !state.getIn(path));

    let immutableDocumentTypes = newState.get('documentTypes');
    let templates = state.get('templates').toJS();
    let thesauris = state.get('thesauris').toJS();

    return newState.set('allDocumentTypes', immutableDocumentTypes.toArray().indexOf(false) === -1)
    .set('properties', libraryFilters(templates, immutableDocumentTypes.toJS(), thesauris));
  }

  if (action.type === types.TOGGLE_ALL_FILTER_DOCUMENT_TYPE) {
    let currentValue = state.get('allDocumentTypes');
    let templates = state.get('templates').toJS();
    let thesauris = state.get('thesauris').toJS();
    let documentTypes = generateDocumentTypes(templates, !currentValue);

    return state.set('allDocumentTypes', !currentValue)
    .set('documentTypes', Immutable.fromJS(documentTypes))
    .set('properties', libraryFilters(templates, documentTypes, thesauris));
  }

  return Immutable.fromJS(state);
}
