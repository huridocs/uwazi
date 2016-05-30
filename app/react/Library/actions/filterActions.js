import * as types from 'app/Library/actions/actionTypes';
import libraryHelper from 'app/Library/helpers/libraryFilters';
import * as libraryActions from 'app/Library/actions/libraryActions';
import {actions as formActions} from 'react-redux-form';

function updateModelFilters(dispatch, getState, libraryFilters) {
  let previousModelFilters = getState().search.filters;
  let modelFilters = libraryFilters.reduce((model, property) => {
    model[property.name] = previousModelFilters[property.name] || '';
    return model;
  }, {});
  dispatch(formActions.change('search.filters', modelFilters));
}

export function filterDocumentType(documentType) {
  return function (dispatch, getState) {
    let state = getState().library.filters.toJS();

    let documentTypes = state.documentTypes;
    let templates = state.templates;
    let thesauris = state.thesauris;

    documentTypes[documentType] = !documentTypes[documentType];
    let libraryFilters = libraryHelper.libraryFilters(templates, documentTypes, thesauris);
    dispatch({type: types.SET_LIBRARY_FILTERS, documentTypes, libraryFilters});
    updateModelFilters(dispatch, getState, libraryFilters);
  };
}

export function filterAllDocumentTypes(newValue) {
  return function (dispatch, getState) {
    let state = getState().library.filters.toJS();

    let documentTypes = state.documentTypes;
    let templates = state.templates;
    let thesauris = state.thesauris;

    Object.keys(documentTypes).forEach((key) => {
      documentTypes[key] = newValue;
    });
    let libraryFilters = libraryHelper.libraryFilters(templates, documentTypes, thesauris);
    dispatch({type: types.SET_LIBRARY_FILTERS, documentTypes, libraryFilters});
    updateModelFilters(dispatch, getState, libraryFilters);
  };
}

export function resetFilters() {
  return function (dispatch, getState) {
    let state = getState().library.filters.toJS();

    let documentTypes = state.documentTypes;
    Object.keys(documentTypes).forEach((key) => {
      documentTypes[key] = false;
    });

    dispatch(formActions.change('search.filters', {}));
    dispatch({type: types.SET_LIBRARY_FILTERS, documentTypes, libraryFilters: []});
    libraryActions.searchDocuments(getState().search)(dispatch, getState);
  };
}

export function toggleFilter(propertyName) {
  return function (dispatch, getState) {
    let state = getState().library.filters.toJS();
    let updatedProperties = state.properties.map((property) => {
      if (property.name === propertyName) {
        property.active = !property.active;
      }
      return property;
    });
    dispatch({type: types.UPDATE_LIBRARY_FILTERS, libraryFilters: updatedProperties});
  };
}

export function activateFilter(propertyName) {
  return function (dispatch, getState) {
    let state = getState().library.filters.toJS();
    let updatedProperties = state.properties.map((property) => {
      if (property.name === propertyName) {
        property.active = true;
      }
      return property;
    });
    dispatch({type: types.UPDATE_LIBRARY_FILTERS, libraryFilters: updatedProperties});
  };
}
