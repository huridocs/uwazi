"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapStateToProps = mapStateToProps;exports.default = exports.UploadBox = void 0;var _redux = require("redux");
var _reactRedux = require("react-redux");
var _reactDropzone = _interopRequireDefault(require("react-dropzone"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));

var _UI = require("../../UI");
var _libraryActions = require("../../Library/actions/libraryActions");
var _uploadsActions = require("../actions/uploadsActions");
var _Multireducer = require("../../Multireducer");
var _socket = _interopRequireDefault(require("../../socket"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

const extractTitle = file => {
  const title = file.name.
  replace(/\.[^/.]+$/, '').
  replace(/_/g, ' ').
  replace(/-/g, ' ').
  replace(/ {2}/g, ' ');

  return title.charAt(0).toUpperCase() + title.slice(1);
};

class UploadBox extends _react.Component {
  constructor(props) {
    super(props);
    this.onDrop = this.onDrop.bind(this);
    _socket.default.on('documentProcessed', sharedId => {
      this.props.documentProcessed(sharedId, 'uploads');
    });

    _socket.default.on('conversionFailed', sharedId => {
      this.props.documentProcessError(sharedId);
    });
  }

  onDrop(files) {
    files.forEach(file => {
      const doc = { title: extractTitle(file) };
      this.props.createDocument(doc).
      then(newDoc => {
        this.props.uploadDocument(newDoc.sharedId, file);
      });
    });
    this.props.unselectAllDocuments();
  }

  render() {
    return (
      _jsx(_reactDropzone.default, { className: "upload-box force-ltr", style: {}, onDrop: this.onDrop, accept: "application/pdf" }, void 0,
      _jsx("div", { className: "upload-box_wrapper" }, void 0,
      _jsx(_UI.Icon, { icon: "upload" }), _jsx("button", { className: "upload-box_link" }, void 0, "Browse your PDFs to upload"),
      _jsx("span", {}, void 0, " or drop your files here.")),

      _jsx("div", { className: "protip" }, void 0,
      _jsx(_UI.Icon, { icon: "lightbulb" }), _jsx("b", {}, void 0, "ProTip!"),
      _jsx("span", {}, void 0, "For better performance, upload your documents in batches of 50 or less."))));



  }}exports.UploadBox = UploadBox;










function mapStateToProps() {
  return {};
}


function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({
    uploadDocument: _uploadsActions.uploadDocument, unselectAllDocuments: _libraryActions.unselectAllDocuments, createDocument: _uploadsActions.createDocument, documentProcessed: _uploadsActions.documentProcessed, documentProcessError: _uploadsActions.documentProcessError },
  (0, _Multireducer.wrapDispatch)(dispatch, 'uploads'));
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(UploadBox);exports.default = _default;