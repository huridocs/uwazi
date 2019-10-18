"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.PageViewer = void 0;var _reactRedux = require("react-redux");
var _reactHelmet = _interopRequireDefault(require("react-helmet"));
var _immutable = _interopRequireDefault(require("immutable"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));

var _Footer = _interopRequireDefault(require("../../App/Footer"));
var _Markdown = _interopRequireDefault(require("../../Markdown"));
var _components = _interopRequireDefault(require("../../Markdown/components"));

var _Script = _interopRequireDefault(require("./Script"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

const { Context } = _components.default;

class PageViewer extends _react.Component {
  render() {
    const { page, itemLists, datasets } = this.props;
    const lists = itemLists.toJS();
    const originalText = page.getIn(['metadata', 'content']) || '';
    const scriptCode = page.getIn(['metadata', 'script']) || '';

    return (
      _jsx("div", { className: "row" }, void 0,
      _jsx(_reactHelmet.default, { title: page.get('title') ? page.get('title') : 'Page' }),
      _jsx("main", { className: "page-viewer document-viewer" }, void 0,
      _jsx("div", { className: "main-wrapper" }, void 0,
      _jsx(Context.Provider, { value: datasets }, void 0,
      _jsx(_Markdown.default, { html: true, markdown: originalText, lists: lists })),

      _jsx(_Footer.default, {}))),


      _jsx(_Script.default, {}, void 0, scriptCode)));


  }}exports.PageViewer = PageViewer;


PageViewer.defaultProps = {
  page: _immutable.default.fromJS({}),
  itemLists: _immutable.default.fromJS([]),
  datasets: _immutable.default.fromJS({}) };








const mapStateToProps = ({ page }) => ({
  page: page.pageView,
  datasets: page.datasets,
  itemLists: page.itemLists });var _default =


(0, _reactRedux.connect)(mapStateToProps)(PageViewer);exports.default = _default;