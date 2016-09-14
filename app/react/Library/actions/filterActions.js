import * as types from 'app/Library/actions/actionTypes';
import libraryHelper from 'app/Library/helpers/libraryFilters';
import * as libraryActions from 'app/Library/actions/libraryActions';
import {actions as formActions} from 'react-redux-form';
import api from 'app/Search/SearchAPI';
import {actions} from 'app/BasicReducer';

function updateModelFilters(dispatch, getState, libraryFilters) {
  let previousModelFilters = getState().search.filters;
  let modelFilters = libraryFilters.reduce((model, property) => {
    model[property.name] = previousModelFilters[property.name] || '';
    if ((property.type === 'select' || property.type === 'multiselect') && model[property.name] === '') {
      model[property.name] = [];
    }

    if (property.type === 'violatedarticles' && model[property.name] === '') {
      model[property.name] = {};
    }

    return model;
  }, {});
  dispatch(formActions.change('search.filters', modelFilters));
}

export function filterDocumentTypes(documentTypes) {
  return function (dispatch, getState) {
    let state = getState();

    let templates = state.templates.toJS();
    let thesauris = state.thesauris.toJS();

    let libraryFilters = libraryHelper.libraryFilters(templates, documentTypes);

    let aggregations = libraryFilters
    .filter((property) => property.type === 'select' || property.type === 'multiselect'|| property.type === 'violatedarticles')
    .map((property) => property.name);

    libraryFilters = libraryHelper.populateOptions(libraryFilters, thesauris);
    dispatch({type: types.SET_LIBRARY_FILTERS, documentTypes, libraryFilters});
    updateModelFilters(dispatch, getState, libraryFilters);

    let search = Object.assign({aggregations, types: documentTypes}, state.search);
    api.search(search)
    .then((response) => {
      dispatch(actions.set('library/aggregations', response.aggregations || []));
    });
  };
}

export function resetFilters() {
  return function (dispatch, getState) {
    dispatch(formActions.change('search.filters', {}));
    dispatch({type: types.SET_LIBRARY_FILTERS, documentTypes: [], libraryFilters: []});
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

export function activateFilter(propertyName, activate) {
  return function (dispatch, getState) {
    let state = getState().library.filters.toJS();
    let updatedProperties = state.properties.map((property) => {
      if (property.name === propertyName) {
        property.active = activate;
      }
      return property;
    });
    dispatch({type: types.UPDATE_LIBRARY_FILTERS, libraryFilters: updatedProperties});
  };
}
