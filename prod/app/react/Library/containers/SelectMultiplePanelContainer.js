"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _reactRedux = require("react-redux");
var _redux = require("redux");
var _Multireducer = require("../../Multireducer");

var _libraryActions = require("../actions/libraryActions");
var _Metadata = require("../../Metadata");

function mapStateToProps(state, props) {
  return {
    formKey: `${props.storeKey}.sidepanel.multipleEdit`,
    state: state[props.storeKey].sidepanel.multipleEdit,
    formState: state[props.storeKey].sidepanel.multipleEditForm,
    templates: state.templates,
    entitiesSelected: state[props.storeKey].ui.get('selectedDocuments'),
    thesauris: state.thesauris,
    storeKey: props.storeKey };

}

function mapDispatchToProps(dispatch, props) {
  return (0, _redux.bindActionCreators)({
    unselectAllDocuments: _libraryActions.unselectAllDocuments,
    updateSelectedEntities: _libraryActions.updateSelectedEntities,
    updateEntities: _libraryActions.updateEntities,
    getAndSelectDocument: _libraryActions.getAndSelectDocument },
  (0, _Multireducer.wrapDispatch)(dispatch, props.storeKey));
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(_Metadata.SelectMultiplePanel);exports.default = _default;