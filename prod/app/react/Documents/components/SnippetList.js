"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.mapStateToProps = exports.SnippetList = exports.DocumentContentSnippets = exports.MetadataFieldSnippets = void 0;

var _react = _interopRequireDefault(require("react"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _reactRedux = require("react-redux");
var _I18N = require("../../I18N");
var _SafeHTML = _interopRequireDefault(require("../../utils/SafeHTML"));
var _getFieldLabel = _interopRequireDefault(require("../../Templates/utils/getFieldLabel"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

const MetadataFieldSnippets = ({ fieldSnippets, documentViewUrl, template, searchTerm }) =>
_jsx(_react.default.Fragment, {}, void 0,
_jsx("li", { className: "snippet-list-item-header metadata-snippet-header" }, void 0,
_jsx(_I18N.I18NLink, { to: `${documentViewUrl}?searchTerm=${searchTerm}` }, void 0,
(0, _getFieldLabel.default)(fieldSnippets.get('field'), template))),


fieldSnippets.get('texts').map((snippet, index) =>
_jsx("li", { className: "snippet-list-item metadata-snippet" }, index,
_jsx("span", {}, void 0, _jsx(_SafeHTML.default, {}, void 0, snippet)))));exports.MetadataFieldSnippets = MetadataFieldSnippets;





MetadataFieldSnippets.defaultProps = {
  searchTerm: '' };














MetadataFieldSnippets.defaultProps = {
  template: undefined };


const DocumentContentSnippets = ({ selectSnippet, documentSnippets, documentViewUrl, searchTerm, selectedSnippet }) =>
_jsx(_react.default.Fragment, {}, void 0,
_jsx("li", { className: "snippet-list-item-header fulltext-snippet-header" }, void 0,
(0, _I18N.t)('System', 'Document contents')),

documentSnippets.map((snippet, index) => {
  const selected = snippet.get('text') === selectedSnippet.get('text') ? 'selected' : '';
  return (
    _jsx("li", { className: `snippet-list-item fulltext-snippet ${selected}` }, index,
    _jsx(_I18N.I18NLink, {
      onClick: () => selectSnippet(snippet.get('page'), snippet),
      to: `${documentViewUrl}?page=${snippet.get('page')}&searchTerm=${searchTerm || ''}` }, void 0,

    _jsx("span", { className: "page-number" }, void 0, snippet.get('page')),
    _jsx("span", { className: "snippet-text" }, void 0, _jsx(_SafeHTML.default, {}, void 0, snippet.get('text'))))));



}));exports.DocumentContentSnippets = DocumentContentSnippets;















const SnippetList = ({ snippets, documentViewUrl, searchTerm, selectSnippet, template, selectedSnippet }) =>
_jsx("ul", { className: "snippet-list" }, void 0,
snippets.get('metadata').map((fieldSnippets) =>
_jsx(MetadataFieldSnippets, {

  fieldSnippets: fieldSnippets,
  template: template,
  documentViewUrl: documentViewUrl,
  searchTerm: searchTerm }, fieldSnippets.get('field'))),


snippets.get('fullText').size ?
_jsx(DocumentContentSnippets, {
  documentSnippets: snippets.get('fullText'),
  documentViewUrl: documentViewUrl,
  selectSnippet: selectSnippet,
  selectedSnippet: selectedSnippet,
  searchTerm: searchTerm }) :

'');exports.SnippetList = SnippetList;


















SnippetList.defaultProps = {
  template: undefined };


const mapStateToProps = (state, ownProps) => ({
  template: state.templates.find(tmpl => tmpl.get('_id') === ownProps.doc.get('template')),
  selectedSnippet: state.documentViewer.uiState.get('snippet') });exports.mapStateToProps = mapStateToProps;var _default =


(0, _reactRedux.connect)(mapStateToProps)(SnippetList);exports.default = _default;