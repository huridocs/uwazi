"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapStateToProps = mapStateToProps;exports.default = void 0;var _reactRedux = require("react-redux");
var _redux = require("redux");
var _immutable = require("immutable");

var _SearchBar = _interopRequireDefault(require("./SearchBar"));
var _RelationshipsGraphEdit = _interopRequireDefault(require("../../Relationships/components/RelationshipsGraphEdit"));
var _LoadMoreRelationshipsButton = _interopRequireDefault(require("../../Relationships/components/LoadMoreRelationshipsButton"));
var _DocumentsList = _interopRequireDefault(require("../../Layout/DocumentsList"));
var _actions = require("../actions/actions");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

function mapStateToProps({ relationships }) {
  const documents = relationships.list.searchResults;

  return {
    documents,
    connections: {
      totalRows: documents.get('rows').
      filter(r => r.get('sharedId') !== relationships.list.sharedId).
      reduce((total, r) => total + r.get('connections').size, 0) },

    filters: (0, _immutable.fromJS)({ documentTypes: [] }),
    search: relationships.list.sort,
    sortButtonsStateProperty: 'relationships/list.sort',
    SearchBar: _SearchBar.default,
    GraphView: _RelationshipsGraphEdit.default,
    view: 'graph',
    LoadMoreButton: _LoadMoreRelationshipsButton.default,
    connectionsGroups: relationships.list.connectionsGroups };

}

function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({
    searchDocuments: _actions.searchReferences },
  dispatch);
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(_DocumentsList.default);exports.default = _default;