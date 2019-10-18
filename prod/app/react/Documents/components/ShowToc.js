"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.mapStateToProps = exports.ShowToc = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactRedux = require("react-redux");
var _uiActions = require("../../Viewer/actions/uiActions");
var _immutable = _interopRequireDefault(require("immutable"));
var _ShowIf = _interopRequireDefault(require("../../App/ShowIf"));
var _I18N = require("../../I18N");
var _UI = require("../../UI");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class ShowToc extends _react.Component {
  scrollTo(tocElement, e) {
    e.preventDefault();
    this.props.scrollTo(tocElement.toJS(), this.props.pdfInfo.toJS(), 'span');
  }

  render() {
    const toc = this.props.toc || _immutable.default.fromJS([]);

    if (!toc.size) {
      return (
        _jsx("div", { className: "blank-state" }, void 0,
        _jsx(_UI.Icon, { icon: "font" }),
        _jsx("h4", {}, void 0, (0, _I18N.t)('System', 'No Table of Content')),
        _jsx("p", {}, void 0, (0, _I18N.t)('System', 'No Table of Content description'))));


    }

    return (
      _jsx("div", { className: "toc" }, void 0,
      _jsx("ul", { className: "toc-view" }, void 0,
      toc.map((tocElement, index) =>
      _jsx("li", { className: `toc-indent-${tocElement.get('indentation')}` }, index,
      _jsx(_ShowIf.default, { if: !this.props.readOnly }, void 0,
      _jsx("a", { className: "toc-view-link", href: "#", onClick: this.scrollTo.bind(this, tocElement) }, void 0, tocElement.get('label'))),

      _jsx(_ShowIf.default, { if: this.props.readOnly }, void 0,
      _jsx("span", { className: "toc-view-link" }, void 0, tocElement.get('label'))))))));






  }}exports.ShowToc = ShowToc;









const mapStateToProps = ({ documentViewer }) => ({
  pdfInfo: documentViewer.doc.get('pdfInfo') });exports.mapStateToProps = mapStateToProps;


function mapDispatchToProps() {
  return { scrollTo: _uiActions.scrollTo };
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(ShowToc);exports.default = _default;