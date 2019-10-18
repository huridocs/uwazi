"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapStateToProps = mapStateToProps;exports.default = exports.UploadEntityStatus = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _Lists = require("../../Layout/Lists");
var _reactRedux = require("react-redux");
var _docState = _interopRequireDefault(require("../docState"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class UploadEntityStatus extends _react.Component {
  renderProgressBar() {
    const isInProgress = this.props.progress || this.props.progress === 0;

    if (isInProgress) {
      return _jsx(_Lists.ItemFooter.ProgressBar, { progress: this.props.progress });
    }
  }

  render() {
    if (!this.props.status) {
      return null;
    }

    const ProgressBar = this.renderProgressBar();

    return (
      _jsx("div", {}, void 0,
      ProgressBar,
      _jsx(_Lists.ItemFooter.Label, { status: this.props.status }, void 0,
      this.props.message)));



  }}exports.UploadEntityStatus = UploadEntityStatus;








function mapStateToProps(state, props) {
  return (0, _docState.default)(state, props);
}var _default =

(0, _reactRedux.connect)(mapStateToProps)(UploadEntityStatus);exports.default = _default;