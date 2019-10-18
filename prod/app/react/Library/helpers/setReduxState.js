"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = setReduxState;var _Multireducer = require("../../Multireducer");
var _libraryActions = require("../actions/libraryActions");
var _reactReduxForm = require("react-redux-form");
var _BasicReducer = require("../../BasicReducer");

function setReduxState(state) {
  return _dispatch => {
    const dispatch = (0, _Multireducer.wrapDispatch)(_dispatch, 'library');
    dispatch(_reactReduxForm.actions.load('library.search', state.library.search));
    dispatch((0, _libraryActions.unsetDocuments)());

    dispatch((0, _libraryActions.initializeFiltersForm)({
      documentTypes: state.library.filters.documentTypes,
      libraryFilters: state.library.filters.properties,
      aggregations: state.library.aggregations }));


    dispatch((0, _libraryActions.setDocuments)(state.library.documents));
    dispatch(_BasicReducer.actions.set('library.markers', state.library.markers));
  };
}