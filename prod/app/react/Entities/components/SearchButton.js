"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapStateToProps = mapStateToProps;exports.default = void 0;var _redux = require("redux");
var _reactRedux = require("react-redux");

var _uiActions = require("../actions/uiActions");
var _SearchButton = require("../../Library/components/SearchButton");

function mapStateToProps({ entityView }) {
  return {
    open: entityView.uiState.get('showFilters') };

}

function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({
    showFilters: _uiActions.showFilters,
    hideFilters: _uiActions.hideFilters,
    unselectAllDocuments: () => {} },
  dispatch);
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(_SearchButton.SearchButton);exports.default = _default;