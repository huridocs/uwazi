"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.DocumentResults = void 0;
var _react = _interopRequireWildcard(require("react"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _redux = require("redux");
var _reactRedux = require("react-redux");
var _immutable = _interopRequireDefault(require("immutable"));

var _I18N = require("../../I18N");
var _SnippetList = _interopRequireDefault(require("../../Documents/components/SnippetList"));
var _uiActions = require("../../Viewer/actions/uiActions");
var _reactReduxForm = require("react-redux-form");
var _ReactReduxForms = require("../../ReactReduxForms");
var _Icon = require("../../Layout/Icon");
var _Layout = require("../../Layout");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

const findResultsAboveThreshold = (results, threshold) => {
  const boundingIndex = results.findIndex(({ score }) => score < threshold);
  return boundingIndex >= 0 ? results.slice(0, boundingIndex) : results;
};

const getSnippetsFromResults = (results, template) => {
  const snippets = results.reduce((_memo, item) => {
    const memo = _memo;
    const text = `${item.text} (${(item.score * 100).toFixed(2)}%)`;
    memo.count += 1;
    if (isNaN(Number(item.page))) {
      const field = template.get('properties').find(p => p.get('name') === item.page).get('label');
      memo.metadata[field] = (memo.metadata[field] || []).concat([text]);
      return memo;
    }
    memo.fullText.push({
      page: Number(item.page),
      text });

    return memo;
  }, { count: 0, metadata: {}, fullText: [] });

  snippets.metadata = Object.keys(snippets.metadata).
  map(field => ({ field, texts: snippets.metadata[field] }));
  return snippets;
};

class DocumentResults extends _react.Component {
  renderSnippetsList(doc, snippets, documentViewUrl) {
    return (
      _jsx(_SnippetList.default, {
        doc: _immutable.default.fromJS(doc),
        documentViewUrl: documentViewUrl,
        snippets: snippets,
        searchTerm: "",
        selectSnippet: (...args) => {this.props.selectSnippet(...args);} }));


  }

  renderFilter() {
    const { threshold } = this.props;
    return (
      _jsx("dl", { className: "metadata-type-text" }, void 0,
      _jsx("dt", { className: "item-header" }, void 0,
      _jsx(_I18N.Translate, {}, void 0, "Threshold"), " ", (threshold * 100).toFixed(2), " %"),

      _jsx("dd", {}, void 0,
      _jsx(_reactReduxForm.Form, { model: "semanticSearch.resultsFilters" }, void 0,
      _jsx(_ReactReduxForms.NumericRangeSlide, {
        model: ".threshold",
        min: 0.3,
        max: 1,
        step: 0.01,
        delay: 200,
        minLabel: (0, _I18N.t)('System', 'Exploration'),
        maxLabel: (0, _I18N.t)('System', 'Precision') })))));





  }

  render() {
    const { doc, threshold, template } = this.props;

    if (!doc.semanticSearch) {
      return false;
    }
    const filteredResults = findResultsAboveThreshold(doc.semanticSearch.results, threshold);
    const snippets = _immutable.default.fromJS(getSnippetsFromResults(filteredResults, template));
    const documentViewUrl = doc.file ? `/document/${doc.sharedId}` : `/entity/${doc.sharedId}`;

    return (
      _jsx(_react.default.Fragment, {}, void 0,
      _jsx("div", { className: "view" }, void 0,
      _jsx("div", { className: "item-info" }, void 0,
      _jsx("div", {}, void 0,
      _jsx(_Icon.Icon, { className: "item-icon item-icon-center", data: doc.icon }),
      _jsx("h1", { className: "item-name" }, void 0,
      doc.title,
      _jsx(_Layout.DocumentLanguage, { doc: _immutable.default.fromJS(doc) }))),


      _jsx(_Layout.TemplateLabel, { template: doc.template })),

      this.renderFilter(),
      _jsx("dl", { className: "metadata-type-numeric" }, void 0,
      _jsx("dt", {}, void 0, _jsx(_I18N.Translate, {}, void 0, "Number of sentences above threshold")),
      _jsx("dd", {}, void 0, filteredResults.length)),

      _jsx("dl", { className: "metadata-type-numeric" }, void 0,
      _jsx("dt", {}, void 0, _jsx(_I18N.Translate, {}, void 0, "% of sentences above threshold")),
      _jsx("dd", {}, void 0, (filteredResults.length / doc.semanticSearch.totalResults * 100).toFixed(2), "%"))),


      this.renderSnippetsList(doc, snippets, documentViewUrl)));


  }}exports.DocumentResults = DocumentResults;


DocumentResults.defaultProps = {
  template: undefined };









const mapStateToProps = ({ semanticSearch, templates }) => ({
  threshold: semanticSearch.resultsFilters.threshold,
  template: templates.find(tpl => tpl.get('_id') === semanticSearch.selectedDocument.get('template')) });



function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({ selectSnippet: _uiActions.selectSnippet }, dispatch);
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(DocumentResults);exports.default = _default;