"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapDispatchToProps = mapDispatchToProps;exports.default = void 0;var _reactRedux = require("react-redux");
var _redux = require("redux");

var _actions = require("../actions/actions");
var _Metadata = require("../../Metadata");

function mapStateToProps(state) {
  return {
    model: 'entityView.entityForm',
    isEntity: state.entityView.entity.get('type') === 'entity',
    templateId: state.entityView.entityForm.template,
    templates: state.templates,
    thesauris: state.thesauris };

}

function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({ changeTemplate: _Metadata.actions.changeTemplate, onSubmit: _actions.saveEntity }, dispatch);
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(_Metadata.MetadataForm);exports.default = _default;