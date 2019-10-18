"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _reactRedux = require("react-redux");
var _redux = require("redux");

var _uploadsActions = require("../actions/uploadsActions");
var _Metadata = require("../../Metadata");

function mapStateToProps({ uploads, templates, thesauris }) {
  return {
    model: 'uploads.metadata',
    isEntity: false,
    templateId: uploads.metadata.template,
    templates,
    thesauris };

}

function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({ changeTemplate: _Metadata.actions.changeTemplate, onSubmit: _uploadsActions.saveDocument }, dispatch);
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(_Metadata.MetadataForm);exports.default = _default;