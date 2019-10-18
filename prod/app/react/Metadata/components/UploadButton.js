"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.UploadButton = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactRedux = require("react-redux");
var _redux = require("redux");
var _actions = require("../actions/actions");
var _uploadsActions = require("../../Uploads/actions/uploadsActions");
var _socket = _interopRequireDefault(require("../../socket"));
var _UI = require("../../UI");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

const renderProgress = (progress) =>
_jsx("div", { className: "item-shortcut btn btn-default btn-disabled" }, void 0,
_jsx("span", {}, void 0, progress, "%"));



const renderProcessing = () =>
_jsx("div", { className: "item-shortcut btn btn-default" }, void 0,
_jsx(_UI.Icon, { icon: "cog", spin: true }));



class UploadButton extends _react.Component {
  constructor(props, context) {
    super(props, context);

    this.state = { processing: false, failed: false, completed: false };
    this.conversionStart = this.conversionStart.bind(this);
    this.conversionFailed = this.conversionFailed.bind(this);
    this.documentProcessed = this.documentProcessed.bind(this);

    _socket.default.on('conversionStart', this.conversionStart);
    _socket.default.on('conversionFailed', this.conversionFailed);
    _socket.default.on('documentProcessed', this.documentProcessed);

    this.onChange = this.onChange.bind(this);
  }

  componentWillUnmount() {
    _socket.default.removeListener('conversionStart', this.conversionStart);
    _socket.default.removeListener('conversionFailed', this.conversionFailed);
    _socket.default.removeListener('documentProcessed', this.documentProcessed);
    clearTimeout(this.timeout);
  }

  onChange(e) {
    const file = e.target.files[0];
    this.context.confirm({
      accept: () => {
        this.props.reuploadDocument(this.props.documentId, file, this.props.documentSharedId, this.props.storeKey);
      },
      title: 'Confirm upload',
      message: 'Are you sure you want to upload a new document?\n\n' +
      'All Table of Contents (TOC) and all text-based references linked to the previous document will be lost.' });

  }

  documentProcessed(docId) {
    if (docId === this.props.documentSharedId) {
      this.props.documentProcessed(docId);
      this.setState({ processing: false, failed: false, completed: true }, () => {
        this.timeout = setTimeout(() => {
          this.setState({ processing: false, failed: false, completed: false });
        }, 2000);
      });
    }
  }

  conversionStart(docId) {
    if (docId === this.props.documentId) {
      this.setState({ processing: true, failed: false, completed: false });
    }
  }

  conversionFailed(docId) {
    if (docId === this.props.documentId) {
      this.setState({ processing: false, failed: true, completed: false });
    }
  }

  renderUploadButton() {
    return (
      _jsx("label", { htmlFor: "upload-button-input", className: "item-shortcut btn btn-default" }, void 0,
      _jsx(_UI.Icon, { icon: "upload" }),
      _jsx("input", {
        onChange: this.onChange,
        type: "file",
        accept: "application/pdf",
        id: "upload-button-input",
        style: { display: 'none' } })));



  }

  renderCompleted() {
    return (
      _jsx("label", { htmlFor: "upload-button-input", className: "item-shortcut btn btn-success" }, void 0,
      _jsx(_UI.Icon, { icon: "check" }),
      _jsx("input", {
        onChange: this.onChange,
        type: "file",
        accept: "application/pdf",
        id: "upload-button-input",
        style: { display: 'none' } })));



  }

  renderFailed() {
    return (
      _jsx("label", { htmlFor: "upload-button-input", className: "item-shortcut btn btn-danger" }, void 0,
      _jsx(_UI.Icon, { icon: "exclamation-triangle" }),
      _jsx("input", {
        onChange: this.onChange,
        type: "file",
        accept: "application/pdf",
        id: "upload-button-input",
        style: { display: 'none' } })));



  }

  render() {
    if (this.state.processing) {
      return renderProcessing();
    }

    if (this.state.failed) {
      return this.renderFailed();
    }

    if (this.state.completed) {
      return this.renderCompleted();
    }

    const progress = this.props.progress.get(this.props.documentId);
    if (progress) {
      return renderProgress(progress);
    }

    return this.renderUploadButton();
  }}exports.UploadButton = UploadButton;











UploadButton.contextTypes = {
  confirm: _propTypes.default.func };


const mapStateToProps = ({ metadata }) => ({ progress: metadata.progress });

function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({ reuploadDocument: _actions.reuploadDocument, documentProcessed: _uploadsActions.documentProcessed }, dispatch);
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(UploadButton);exports.default = _default;