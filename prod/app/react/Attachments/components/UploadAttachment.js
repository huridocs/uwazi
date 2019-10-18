"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapStateToProps = mapStateToProps;exports.mapDispatchToProps = mapDispatchToProps;exports.default = exports.UploadAttachment = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactRedux = require("react-redux");
var _redux = require("redux");
var _t = _interopRequireDefault(require("../../I18N/t"));
var _UI = require("../../UI");

var _actions = require("../actions/actions");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class UploadAttachment extends _react.Component {
  onChangeSingle(e) {
    const file = e.target.files[0];
    this.props.uploadAttachment(this.props.entity, file, this.props.storeKey);
  }

  onChangeAll(e) {
    const file = e.target.files[0];
    this.props.uploadAttachment(this.props.entity, file, this.props.storeKey, { allLanguages: true });
  }

  renderUploadButton() {
    let uploadToAll = null;

    if (this.props.languages.size > 1) {
      uploadToAll =
      _jsx("label", { htmlFor: "upload-attachment-all-input", className: "btn btn-success btn-xs add" }, void 0,
      _jsx("span", { className: "btn-label" }, void 0,
      _jsx(_UI.Icon, { icon: "link" }), " ", (0, _t.default)('System', 'Add to all languages')),

      _jsx("input", { onChange: this.onChangeAll.bind(this), type: "file", id: "upload-attachment-all-input", style: { display: 'none' } }));


    }

    return (
      _jsx("div", {}, void 0,
      _jsx("label", { htmlFor: "upload-attachment-input", className: "btn btn-success btn-xs add" }, void 0,
      _jsx("span", { className: "btn-label" }, void 0,
      _jsx(_UI.Icon, { icon: "paperclip" }), " ", (0, _t.default)('System', 'Add file')),

      _jsx("input", { onChange: this.onChangeSingle.bind(this), type: "file", id: "upload-attachment-input", style: { display: 'none' } })),

      uploadToAll));


  }

  renderProgress(progress) {
    return (
      _jsx("div", { className: "btn btn-default btn-disabled" }, void 0,
      _jsx("span", { className: "btn-label" }, void 0, (0, _t.default)('System', 'Uploading')),
      _jsx("span", {}, void 0, "\xA0\xA0", progress, "%")));


  }

  render() {
    const progress = this.props.progress.get(this.props.entity);
    return progress ? this.renderProgress(progress) : this.renderUploadButton();
  }}exports.UploadAttachment = UploadAttachment;










function mapStateToProps({ attachments, settings }) {
  return {
    progress: attachments.progress,
    languages: settings.collection.get('languages') };

}

function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({ uploadAttachment: _actions.uploadAttachment }, dispatch);
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(UploadAttachment);exports.default = _default;