"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _reactTabsRedux = require("react-tabs-redux");
var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));

var _Markdown = _interopRequireDefault(require("../../Markdown"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class MarkDown extends _react.Component {
  render() {
    const { rows } = this.props;
    return (
      _jsx(_reactTabsRedux.Tabs, { renderActiveTabContentOnly: true, className: "markdownEditor" }, void 0,
      _jsx("div", { className: "tab-nav" }, void 0,
      _jsx(_reactTabsRedux.TabLink, { to: "edit", default: true }, void 0, "Edit"),
      _jsx(_reactTabsRedux.TabLink, { to: "preview" }, void 0, "Preview"),
      _jsx("a", {
        className: "tab-link tab-link--help",
        href: "https://guides.github.com/features/mastering-markdown/",
        target: "_blank",
        rel: "noopener noreferrer" }, void 0, "help")),




      _jsx(_reactTabsRedux.TabContent, { for: "edit" }, void 0,
      _jsx("textarea", { className: "form-control", rows: rows, onChange: this.props.onChange, value: this.props.value })),

      _jsx(_reactTabsRedux.TabContent, { for: "preview", className: "markdownViewer" }, void 0,
      _jsx(_Markdown.default, { html: this.props.htmlOnViewer, markdown: this.props.value }))));



  }}exports.default = MarkDown;


MarkDown.defaultProps = {
  value: '',
  rows: 6,
  htmlOnViewer: false };