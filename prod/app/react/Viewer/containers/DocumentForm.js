"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapDispatchToProps = mapDispatchToProps;exports.default = void 0;var _reactRedux = require("react-redux");
var _redux = require("redux");
var _Metadata = require("../../Metadata");
var _Relationships = require("../../Relationships");
var _documentActions = require("../actions/documentActions");

function mapStateToProps({ documentViewer, templates, thesauris }) {
  return {
    model: 'documentViewer.sidepanel.metadata',
    isEntity: !documentViewer.sidepanel.file,
    templateId: documentViewer.sidepanel.metadata.template,
    templates,
    thesauris };

}

function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({
    changeTemplate: _Metadata.actions.changeTemplate,
    onSubmit: doc => disp => (0, _documentActions.saveDocument)(doc)(disp).
    then(() => {
      disp(_Relationships.actions.reloadRelationships(doc.sharedId));
    }) },
  dispatch);
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(_Metadata.MetadataForm);exports.default = _default;