"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.mapStateToProps = exports.CustomUploads = void 0;var _redux = require("redux");
var _reactRedux = require("react-redux");
var _reactDropzone = _interopRequireDefault(require("react-dropzone"));
var _immutable = _interopRequireDefault(require("immutable"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireDefault(require("react"));

var _Layout = require("../../Layout");
var _BasicReducer = require("../../BasicReducer");
var _I18N = require("../../I18N");
var _RouteHandler = _interopRequireDefault(require("../../App/RouteHandler"));
var _api = _interopRequireDefault(require("../../utils/api"));
var _UI = require("../../UI");

var _uploadsActions = require("../../Uploads/actions/uploadsActions");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class CustomUploads extends _RouteHandler.default {
  static async requestState(requestParams) {
    const customUploads = await _api.default.get('customisation/upload', requestParams);
    return [
    _BasicReducer.actions.set('customUploads', customUploads.json)];

  }

  constructor(props, context) {
    super(props, context);
    this.onDrop = this.onDrop.bind(this);
  }

  onDrop(files) {
    files.forEach(file => {
      this.props.upload(file);
    });
  }

  render() {
    return (
      _jsx("div", { className: "panel panel-default" }, void 0,
      _jsx("div", { className: "panel-heading" }, void 0, (0, _I18N.t)('System', 'Custom Uploads')),
      _jsx("div", { className: "panel-body custom-uploads" }, void 0,
      _jsx(_reactDropzone.default, {
        className: "upload-box",
        onDrop: this.onDrop }, void 0,

      _jsx("div", { className: "upload-box_wrapper" }, void 0,
      _jsx(_UI.Icon, { icon: "upload" }),
      _jsx("button", { className: "upload-box_link", type: "button" }, void 0, "Browse files to upload"),
      _jsx("span", {}, void 0, " or drop your files here.")),

      this.props.progress && _jsx("div", { className: "uploading" }, void 0, _jsx(_UI.Icon, { icon: "spinner", spin: true }), " Uploading ...")),

      _jsx("ul", {}, void 0,
      this.props.customUploads.map((upload) =>
      _jsx("li", {}, upload.get('filename'),
      _jsx(_Layout.Thumbnail, { file: `/assets/${upload.get('filename')}` }),
      _jsx("div", { className: "info" }, void 0, "URL:",
      _jsx("br", {}),
      _jsx("span", { className: "thumbnail-url" }, void 0, `/assets/${upload.get('filename')}`),
      _jsx(_Layout.ConfirmButton, { action: () => this.props.deleteCustomUpload(upload.get('_id')) }, void 0, "Delete"))))))));







  }}exports.CustomUploads = CustomUploads;


CustomUploads.defaultProps = {
  progress: false };


CustomUploads.propTypes = {
  progress: _propTypes.default.bool,
  customUploads: _propTypes.default.instanceOf(_immutable.default.List).isRequired,
  upload: _propTypes.default.func.isRequired,
  deleteCustomUpload: _propTypes.default.func.isRequired };


const mapStateToProps = ({ customUploads, progress }) => ({
  customUploads,
  progress: !!progress.filter((v, key) => key.match(/customUpload/)).size });exports.mapStateToProps = mapStateToProps;


const mapDispatchToProps = dispatch => (0, _redux.bindActionCreators)({ upload: _uploadsActions.uploadCustom, deleteCustomUpload: _uploadsActions.deleteCustomUpload }, dispatch);var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(CustomUploads);exports.default = _default;