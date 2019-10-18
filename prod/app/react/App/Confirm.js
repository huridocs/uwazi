"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.Confirm = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _I18N = require("../I18N");

var _Modal = _interopRequireDefault(require("../Layout/Modal"));
var _Loader = _interopRequireDefault(require("../components/Elements/Loader"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class Confirm extends _react.Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: props.isOpen,
      isLoading: props.isLoading,
      confirmInputValue: '' };


    this.accept = this.accept.bind(this);
    this.cancel = this.cancel.bind(this);
    this.close = this.close.bind(this);
    this.handleInput = this.handleInput.bind(this);
  }

  componentWillReceiveProps(newProps) {
    if (newProps.accept !== this.props.accept) {
      this.setState({ isOpen: true });
    }
  }

  close() {
    this.setState({ isOpen: false, confirmInputValue: '', isLoading: false });
  }

  accept() {
    if (this.props.accept) {
      const actionResponse = this.props.accept();
      if (actionResponse && actionResponse instanceof Promise) {
        this.setState({ isLoading: true });
        actionResponse.then(this.close);
        actionResponse.catch(this.close);
        return;
      }
    }
    this.close();
  }

  cancel() {
    if (this.props.cancel) {
      this.props.cancel();
    }
    this.close();
  }

  handleInput(e) {
    this.setState({ confirmInputValue: e.target.value });
  }

  renderExtraConfirm() {
    return (
      _jsx(_react.default.Fragment, {}, void 0,
      _jsx("p", {}, void 0, " If you want to continue, please type '", this.props.extraConfirmWord, "' "),
      _jsx("input", { type: "text", onChange: this.handleInput, value: this.state.confirmInputValue })));


  }

  render() {
    const { type } = this.props;
    return (
      _jsx(_Modal.default, { isOpen: this.state.isOpen, type: type }, void 0,

      _jsx(_Modal.default.Body, {}, void 0,
      _jsx("h4", {}, void 0, this.props.title),
      _jsx("p", {}, void 0, this.props.message),
      this.props.extraConfirm && !this.state.isLoading && this.renderExtraConfirm(),
      this.state.isLoading && _jsx(_Loader.default, {})),



      !this.state.isLoading &&
      _jsx(_Modal.default.Footer, {}, void 0,

      !this.props.noCancel &&
      _jsx("button", { type: "button", className: "btn btn-default cancel-button", onClick: this.cancel }, void 0, (0, _I18N.t)('System', 'Cancel')),

      _jsx("button", {
        type: "button",
        disabled: this.props.extraConfirm && this.state.confirmInputValue !== this.props.extraConfirmWord,
        className: `btn confirm-button btn-${type}`,
        onClick: this.accept }, void 0,

      (0, _I18N.t)('System', 'Accept')))));






  }}exports.Confirm = Confirm;


Confirm.defaultProps = {
  isLoading: false,
  extraConfirm: false,
  isOpen: false,
  noCancel: false,
  type: 'danger',
  title: 'Confirm action',
  message: 'Are you sure you want to continue?',
  extraConfirmWord: 'CONFIRM' };var _default =















Confirm;exports.default = _default;