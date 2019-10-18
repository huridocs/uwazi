"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.filterDocumentTypes = filterDocumentTypes;exports.resetFilters = resetFilters;exports.toggleFilter = toggleFilter;var types = _interopRequireWildcard(require("./actionTypes"));
var _libraryFilters = _interopRequireDefault(require("../helpers/libraryFilters"));
var _comonProperties = _interopRequireDefault(require("../../../shared/comonProperties"));
var libraryActions = _interopRequireWildcard(require("./libraryActions"));
var _prioritySortingCriteria = _interopRequireDefault(require("../../utils/prioritySortingCriteria"));
var _reactReduxForm = require("react-redux-form");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}

function filterDocumentTypes(documentTypes, storeKey) {
  return (dispatch, getState) => {
    const state = getState();

    const templates = state.templates.toJS();
    const thesauris = state.thesauris.toJS();

    let libraryFilters = _comonProperties.default.comonProperties(templates, documentTypes).
    filter(prop => prop.filter);
    libraryFilters = _libraryFilters.default.populateOptions(libraryFilters, thesauris);

    const usefulTemplates = documentTypes.length ? templates.filter(t => documentTypes.includes(t._id)) : templates;

    const { sort, order } = _prioritySortingCriteria.default.get({
      currentCriteria: { sort: state[storeKey].search.sort, order: state[storeKey].search.order },
      filteredTemplates: usefulTemplates.map(t => t._id),
      templates: state.templates,
      selectedSorting: state[storeKey].selectedSorting });


    const search = Object.assign({ _types: documentTypes }, state[storeKey].search, { sort, order });
    const filters = { documentTypes, properties: libraryFilters };
    dispatch(libraryActions.searchDocuments({ filters, search }, storeKey));
  };
}

function resetFilters(storeKey) {
  return (dispatch, getState) => {
    dispatch({ type: types.SET_LIBRARY_FILTERS, documentTypes: [], libraryFilters: [] });
    dispatch(_reactReduxForm.actions.load(`${storeKey}.search`, {
      searchTerm: '',
      filters: {},
      order: 'desc',
      sort: 'creationDate' }));

    libraryActions.searchDocuments({ search: getState()[storeKey].search }, storeKey)(dispatch, getState);
  };
}

function toggleFilter(propertyName, properties) {
  return dispatch => {
    const updatedProperties = properties.map(property => {
      if (property.name === propertyName) {
        property.active = !property.active;
      }
      return property;
    });
    dispatch({ type: types.UPDATE_LIBRARY_FILTERS, libraryFilters: updatedProperties });
  };
}