"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.RemovePropertyConfirm = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactRedux = require("react-redux");
var _redux = require("redux");
var _Modal = _interopRequireDefault(require("../../Layout/Modal"));

var _templateActions = require("../actions/templateActions");
var _modalActions = require("../../Modals/actions/modalActions");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class RemovePropertyConfirm extends _react.Component {
  confirm() {
    this.props.hideModal('RemovePropertyModal');
    this.props.removeProperty(this.props.propertyBeingDeleted);
  }

  render() {
    return (
      _jsx(_Modal.default, { isOpen: this.props.isOpen || false, type: "danger" }, void 0,

      _jsx(_Modal.default.Body, {}, void 0,
      _jsx("h4", {}, void 0, "Confirm deletion"),
      _jsx("p", {}, void 0, "Deleting a template property will delete this metadata information on all documents using this template."),
      _jsx("p", {}, void 0, "Change will take effect after saving the template")),


      _jsx(_Modal.default.Footer, {}, void 0,
      _jsx("button", { type: "button", className: "btn btn-default cancel-button", onClick: () => this.props.hideModal('RemovePropertyModal') }, void 0, "Cancel"),
      _jsx("button", { type: "button", className: "btn btn-danger confirm-button", onClick: () => this.confirm() }, void 0, "Delete Property"))));




  }}exports.RemovePropertyConfirm = RemovePropertyConfirm;









const mapStateToProps = state => {
  const propertyBeingDeleted = state.modals.toJS().RemovePropertyModal;
  return {
    propertyBeingDeleted,
    isOpen: typeof propertyBeingDeleted === 'number' };

};

function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({ hideModal: _modalActions.hideModal, removeProperty: _templateActions.removeProperty }, dispatch);
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(RemovePropertyConfirm);exports.default = _default;