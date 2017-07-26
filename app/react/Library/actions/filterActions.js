import * as types from 'app/Library/actions/actionTypes';
import libraryHelper from 'app/Library/helpers/libraryFilters';
import comonPropertiesHelper from 'shared/comonProperties';
import * as libraryActions from 'app/Library/actions/libraryActions';
import prioritySortingCriteria from 'app/utils/prioritySortingCriteria';

export function filterDocumentTypes(documentTypes, storeKey) {
  return function (dispatch, getState) {
    const state = getState();

    const templates = state.templates.toJS();
    const thesauris = state.thesauris.toJS();

    const currentFilters = state[storeKey].filters.toJS().properties;
    let libraryFilters = comonPropertiesHelper.comonProperties(templates, documentTypes)
    .filter((prop) => prop.filter);
    libraryFilters = libraryHelper.populateOptions(libraryFilters, thesauris);
    libraryFilters.forEach((libraryFilter) => {
      const currentFilter = currentFilters.find((f) => f.name === libraryFilter.name) || {};
      libraryFilter.active = currentFilter.active;
    });
    dispatch({type: types.SET_LIBRARY_FILTERS, documentTypes, libraryFilters});

    const usefulTemplates = documentTypes.length ? templates.filter(t => documentTypes.includes(t._id)) : templates;

    const {sort, order} = prioritySortingCriteria.get({
      currentCriteria: {sort: state[storeKey].search.sort, order: state[storeKey].search.order},
      filteredTemplates: usefulTemplates.map(t => t._id),
      templates: state.templates,
      selectedSorting: state[storeKey].selectedSorting
    });

    const search = Object.assign({types: documentTypes}, state[storeKey].search, {sort, order});
    dispatch(libraryActions.searchDocuments(search, storeKey));
  };
}

export function resetFilters(storeKey) {
  return function (dispatch, getState) {
    dispatch({type: types.SET_LIBRARY_FILTERS, documentTypes: [], libraryFilters: []});
    libraryActions.searchDocuments(getState()[storeKey].search, storeKey)(dispatch, getState);
  };
}

export function toggleFilter(propertyName, properties) {
  return function (dispatch) {
    let updatedProperties = properties.map((property) => {
      if (property.name === propertyName) {
        property.active = !property.active;
      }
      return property;
    });
    dispatch({type: types.UPDATE_LIBRARY_FILTERS, libraryFilters: updatedProperties});
  };
}

export function activateFilter(propertyName, activate, properties) {
  return function (dispatch) {
    let updatedProperties = properties.map((property) => {
      if (property.name === propertyName) {
        property.active = activate;
      }
      return property;
    });
    dispatch({type: types.UPDATE_LIBRARY_FILTERS, libraryFilters: updatedProperties});
  };
}
