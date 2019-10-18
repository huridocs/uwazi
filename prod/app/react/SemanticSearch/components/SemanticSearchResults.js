"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapDispatchToProps = mapDispatchToProps;exports.default = exports.mapStateToProps = exports.SemanticSearchResults = void 0;var _react = _interopRequireWildcard(require("react"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _reactRedux = require("react-redux");
var _redux = require("redux");

var _reactHelmet = _interopRequireDefault(require("react-helmet"));
var _Lists = require("../../Layout/Lists");
var _Doc = _interopRequireDefault(require("../../Library/components/Doc"));
var semanticSearchActions = _interopRequireWildcard(require("../actions/actions"));
var _immutable = _interopRequireDefault(require("immutable"));
var _I18N = require("../../I18N");
var _SearchDescription = _interopRequireDefault(require("../../Library/components/SearchDescription"));
var _UI = require("../../UI");
var _ResultsSidePanel = _interopRequireDefault(require("./ResultsSidePanel"));
var _SemanticSearchMultieditPanel = _interopRequireDefault(require("./SemanticSearchMultieditPanel"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

function renderAditionalText(doc) {
  const resultsSize = doc.getIn(['semanticSearch', 'totalResults']);
  const aboveThreshold = doc.getIn(['semanticSearch', 'numRelevant']);
  const percentage = doc.getIn(['semanticSearch', 'relevantRate']) * 100;

  return (
    _jsx("div", { className: "item-metadata" }, void 0,
    _jsx("div", { className: "metadata-type-text" }, void 0,
    _jsx("div", {}, void 0, _jsx(_I18N.Translate, {}, void 0, "Sentences above threshold")),
    _jsx("div", {}, void 0, aboveThreshold, " out of ", resultsSize, " (", percentage.toFixed(2), "%)"))));



}

class SemanticSearchResults extends _react.Component {
  constructor(props) {
    super(props);
    this.state = { page: 1 };
    this.onClick = this.onClick.bind(this);
    this.onLoadMoreClick = this.onLoadMoreClick.bind(this);
    this.multiEdit = this.multiEdit.bind(this);
  }

  shouldComponentUpdate(nextProps) {
    const { items, filters, isEmpty, searchTerm } = this.props;
    return !_immutable.default.is(nextProps.items, items) ||
    Boolean(nextProps.filters.threshold !== filters.threshold) ||
    Boolean(nextProps.filters.minRelevantSentences !== filters.minRelevantSentences) ||
    Boolean(nextProps.isEmpty !== isEmpty) ||
    Boolean(nextProps.searchTerm !== searchTerm);
  }

  componentDidUpdate(prevProps) {
    const { filters, searchId } = this.props;
    if (filters.minRelevantSentences !== prevProps.filters.minRelevantSentences ||
    filters.threshold !== prevProps.filters.threshold) {
      this.props.getSearch(searchId, filters);
    }
  }

  onClick(e, doc) {
    this.props.selectSemanticSearchDocument(doc);
  }

  onLoadMoreClick() {
    const { searchId, filters } = this.props;
    const { page } = this.state;
    const limit = 30;
    const skip = page * limit;
    const args = _objectSpread({}, filters, { skip, limit });
    this.setState({ page: page + 1 });
    this.props.getMoreSearchResults(searchId, args);
  }

  multiEdit() {
    const { editSearchEntities: edit, filters, searchId } = this.props;
    edit(searchId, filters);
  }

  render() {
    const { items, isEmpty, searchTerm, totalCount, query, searchId } = this.props;
    return (
      _jsx("div", { className: "row panels-layout" }, void 0,
      isEmpty &&
      _jsx(_react.default.Fragment, {}, void 0,
      _jsx("p", {}, void 0, "Search not found"),
      _jsx(_reactHelmet.default, { title: "Semantic search not found" })),


      !isEmpty &&
      _jsx(_react.default.Fragment, {}, void 0,
      _jsx(_reactHelmet.default, { title: `${searchTerm} - Semantic search results` }),
      _jsx("main", { className: "semantic-search-results-viewer document-viewer with-panel" }, void 0,
      _jsx("div", {}, void 0,
      _jsx("h3", {}, void 0,
      _jsx(_I18N.Translate, {}, void 0, "Semantic search"), ": ", _jsx(_SearchDescription.default, { searchTerm: searchTerm, query: query })),

      _jsx("button", {
        type: "button",
        onClick: this.multiEdit,
        className: "btn btn-success edit-semantic-search" }, void 0,

      _jsx(_UI.Icon, { icon: "pencil-alt" }), "\xA0",
      _jsx(_I18N.Translate, {}, void 0, "Edit all documents matching this criteria"))),


      _jsx("div", { className: "documents-counter" }, void 0,
      _jsx("span", { className: "documents-counter-label" }, void 0,
      _jsx("b", {}, void 0, totalCount), " ", _jsx(_I18N.Translate, {}, void 0, "documents"))),


      _jsx(_Lists.RowList, {}, void 0,
      items.map((doc) =>
      _jsx(_Doc.default, {
        doc: doc,

        onClick: this.onClick,
        additionalText: renderAditionalText(doc) }, doc.get('sharedId')))),



      _jsx("p", { className: "col-sm-12 text-center documents-counter" }, void 0,
      _jsx("b", {}, void 0, " ", items.size, " "), " ", _jsx(_I18N.Translate, {}, void 0, "of"),
      _jsx("b", {}, void 0, " ", totalCount, " "), " ", _jsx(_I18N.Translate, {}, void 0, "documents")),

      _jsx("div", { className: "col-sm-12 text-center documents-counter" }, void 0,
      _jsx("button", { onClick: this.onLoadMoreClick, type: "button", className: "btn btn-default btn-load-more" }, void 0, "30 ",
      _jsx(_I18N.Translate, {}, void 0, "x more")))),



      _jsx(_ResultsSidePanel.default, {}),
      _jsx(_SemanticSearchMultieditPanel.default, { searchId: searchId, formKey: "semanticSearch.multipleEdit" }))));




  }}exports.SemanticSearchResults = SemanticSearchResults;


SemanticSearchResults.defaultProps = {
  searchTerm: '',
  items: _immutable.default.fromJS([]),
  query: { searchTerm: '' },
  searchId: '' };























const mapStateToProps = state => {
  const { search } = state.semanticSearch;
  const searchTerm = search.get('searchTerm');
  const items = search.get('results');
  const filters = state.semanticSearch.resultsFilters;
  const isEmpty = search.size === 0;
  const { _id, query } = search.toJS();

  return {
    searchId: _id,
    query: query || { searchTerm: '' },
    totalCount: isEmpty ? 0 : search.get('documents').size,
    searchTerm,
    filters,
    items,
    isEmpty };

};exports.mapStateToProps = mapStateToProps;

function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)(semanticSearchActions, dispatch);
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(SemanticSearchResults);exports.default = _default;