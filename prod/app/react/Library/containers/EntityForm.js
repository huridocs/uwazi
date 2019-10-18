"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _reactRedux = require("react-redux");
var _redux = require("redux");
var _Multireducer = require("../../Multireducer");

var _libraryActions = require("../actions/libraryActions");
var _Metadata = require("../../Metadata");

function mapStateToProps(state, props) {
  const { templates } = state;
  const { thesauris } = state;
  return {
    model: `${props.storeKey}.sidepanel.metadata`,
    isEntity: !state[props.storeKey].sidepanel.file,
    templateId: state[props.storeKey].sidepanel.metadata.template,
    templates,
    thesauris };

}

function mapDispatchToProps(dispatch, props) {
  return (0, _redux.bindActionCreators)({ changeTemplate: _Metadata.actions.changeTemplate, onSubmit: _libraryActions.saveEntity }, (0, _Multireducer.wrapDispatch)(dispatch, props.storeKey));
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(_Metadata.MetadataForm);exports.default = _default;