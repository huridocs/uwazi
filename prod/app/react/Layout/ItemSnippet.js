"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.mapStateToProps = exports.ItemSnippet = void 0;var _reactRedux = require("react-redux");
var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireDefault(require("react"));

var _SafeHTML = _interopRequireDefault(require("../utils/SafeHTML"));
var _getFieldLabel = _interopRequireDefault(require("../Templates/utils/getFieldLabel"));

var _t = _interopRequireDefault(require("../I18N/t"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

const ItemSnippet = ({ snippets, onSnippetClick, template }) => {
  let content;
  let source;
  if (snippets.metadata.length) {
    source = (0, _getFieldLabel.default)(snippets.metadata[0].field, template);
    [content] = snippets.metadata[0].texts;
  } else {
    source = (0, _t.default)('System', 'Document contents');
    content = snippets.fullText[0].text;
  }
  /* eslint-disable react/no-danger */
  const snippetElement =
  _jsx(_react.default.Fragment, {}, void 0,
  _jsx("div", { className: "item-snippet-source" }, void 0, source),
  _jsx("div", {
    onClick: onSnippetClick,
    className: "item-snippet" }, void 0,

  _jsx(_SafeHTML.default, {}, void 0, content)));




  if (snippets.count === 1) {
    return _jsx("div", { className: "item-snippet-wrapper" }, void 0, snippetElement);
  }

  return (
    _jsx("div", { className: "item-snippet-wrapper" }, void 0,
    snippetElement,
    _jsx("div", {}, void 0,
    _jsx("a", { onClick: onSnippetClick }, void 0, (0, _t.default)('System', 'Show more')))));



};exports.ItemSnippet = ItemSnippet;
















ItemSnippet.defaultProps = {
  onSnippetClick: undefined };


const mapStateToProps = (state, ownProps) => ({
  template: state.templates.find(tmpl => tmpl.get('_id') === ownProps.doc.template) });exports.mapStateToProps = mapStateToProps;var _default =


(0, _reactRedux.connect)(mapStateToProps)(ItemSnippet);exports.default = _default;