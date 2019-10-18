"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapStateToProps = mapStateToProps;exports.default = exports.SearchBar = void 0;var _reactReduxForm = require("react-redux-form");
var _redux = require("redux");
var _reactRedux = require("react-redux");
var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));

var _UI = require("../../UI");
var _libraryActions = require("../actions/libraryActions");
var _I18N = require("../../I18N");
var _Multireducer = require("../../Multireducer");
var _SearchTips = _interopRequireDefault(require("./SearchTips"));
var _actions = require("../../SemanticSearch/actions/actions");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class SearchBar extends _react.Component {
  constructor(props) {
    super(props);
    this.search = this.search.bind(this);
    this.resetSearch = this.resetSearch.bind(this);
    this.submitSearch = this.submitSearch.bind(this);
    this.submitSemanticSearch = this.submitSemanticSearch.bind(this);
  }

  resetSearch() {
    this.props.change(`${this.props.storeKey}.search.searchTerm`, '');
    const search = Object.assign({}, this.props.search);
    search.searchTerm = '';
    this.props.searchDocuments({ search }, this.props.storeKey);
  }

  submitSemanticSearch() {
    this.props.semanticSearch(this.props.search);
  }

  submitSearch() {
    const search = Object.assign({}, this.props.search);
    this.props.searchDocuments({ search }, this.props.storeKey);
  }

  search(search) {
    this.props.searchDocuments({ search }, this.props.storeKey);
  }

  render() {
    const { search, semanticSearchEnabled, storeKey } = this.props;
    const model = `${storeKey}.search`;
    return (
      _jsx("div", { className: "search-box" }, void 0,
      _jsx(_reactReduxForm.Form, { model: model, onSubmit: this.search, autoComplete: "off" }, void 0,
      _jsx("div", { className: `input-group${search.searchTerm ? ' is-active' : ''}` }, void 0,
      _jsx(_reactReduxForm.Field, { model: ".searchTerm" }, void 0,
      _jsx("input", {
        type: "text",
        placeholder: (0, _I18N.t)('System', 'Search', null, false),
        className: "form-control",
        autoComplete: "off" }),

      _jsx(_UI.Icon, {
        icon: "times",
        onClick: this.resetSearch })),


      _jsx(_UI.Icon, {
        icon: "search",
        onClick: this.submitSearch })),


      semanticSearchEnabled &&
      _jsx("button", {
        disabled: search.searchTerm ? '' : 'disabled',
        type: "button",
        onClick: this.submitSemanticSearch,
        className: "btn btn-success semantic-search-button" }, void 0,

      _jsx(_UI.Icon, { icon: "flask" }), " Semantic Search")),



      _jsx(_SearchTips.default, {})));


  }}exports.SearchBar = SearchBar;


SearchBar.defaultProps = {
  semanticSearchEnabled: false };











function mapStateToProps(state, props) {
  const features = state.settings.collection.toJS().features || {};
  const search = (0, _libraryActions.processFilters)(state[props.storeKey].search, state[props.storeKey].filters.toJS());
  return {
    search,
    semanticSearchEnabled: features.semanticSearch };

}

function mapDispatchToProps(dispatch, props) {
  return (0, _redux.bindActionCreators)({
    searchDocuments: _libraryActions.searchDocuments,
    change: _reactReduxForm.actions.change,
    semanticSearch: _actions.submitNewSearch },
  (0, _Multireducer.wrapDispatch)(dispatch, props.storeKey));
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(SearchBar);exports.default = _default;