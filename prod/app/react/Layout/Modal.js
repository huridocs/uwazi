"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactModal = _interopRequireDefault(require("react-modal"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class Modal extends _react.Component {
  render() {
    const style = { overlay: { zIndex: 100, backgroundColor: 'rgba(0, 0, 0, 0.75)' } };
    const type = this.props.type || 'success';
    return (
      _jsx(_reactModal.default, {
        style: style,
        className: `modal-dialog modal-${type}`,
        isOpen: this.props.isOpen,
        contentLabel: "",
        ariaHideApp: false }, void 0,

      _jsx("div", { className: "modal-content" }, void 0,
      this.props.children)));



  }}exports.default = Modal;














const Body = ({ children }) => _jsx("div", { className: "modal-body" }, void 0, children);


const Header = ({ children }) => _jsx("div", { className: "modal-header" }, void 0, children);


const Footer = ({ children }) => _jsx("div", { className: "modal-footer" }, void 0, children);


const Title = ({ children }) => _jsx("h4", { className: "modal-title" }, void 0, children);


const Close = ({ onClick }) =>
_jsx("button", { type: "button", className: "close", onClick: onClick }, void 0,
_jsx("span", { "aria-hidden": "true" }, void 0, "\xD7"),
_jsx("span", { className: "sr-only" }, void 0, "Close"));




Modal.Body = Body;
Modal.Header = Header;
Modal.Footer = Footer;
Modal.Title = Title;
Modal.Close = Close;