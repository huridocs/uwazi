"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.AttachmentsList = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactRedux = require("react-redux");

var _advancedSort = require("../../utils/advancedSort");
var _I18N = require("../../I18N");

var _Auth = require("../../Auth");
var _Attachment = _interopRequireDefault(require("./Attachment"));
var _UploadAttachment = _interopRequireDefault(require("./UploadAttachment"));
var _UploadButton = _interopRequireDefault(require("../../Metadata/components/UploadButton"));
var _ViewDocButton = _interopRequireDefault(require("../../Library/components/ViewDocButton"));
var _Tip = _interopRequireDefault(require("../../Layout/Tip"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class AttachmentsList extends _react.Component {
  getExtension(filename) {
    return filename.substr(filename.lastIndexOf('.') + 1);
  }

  arrangeFiles(files, isDocumentAttachments) {
    if (!files.length) {
      return files;
    }

    const firstFiles = [];
    if (isDocumentAttachments) {
      firstFiles.push(files.shift());
    }

    const sortedFiles = (0, _advancedSort.advancedSort)(files, { property: 'originalname' });
    return firstFiles.concat(sortedFiles);
  }

  renderMainDocument(mainFile) {
    const { parentId, parentSharedId, readOnly, storeKey } = this.props;
    const forcedReadOnly = readOnly || Boolean(this.props.isTargetDoc);
    if (mainFile) {
      mainFile._id = parentId;
      return (
        _jsx("div", {}, void 0,
        _jsx("h2", {}, void 0,
        (0, _I18N.t)('System', 'Document')),

        _jsx("div", { className: "attachments-list" }, void 0,
        _jsx(_Attachment.default, {
          file: mainFile,
          parentId: parentId,
          readOnly: forcedReadOnly,
          storeKey: storeKey,
          parentSharedId: parentSharedId,
          isSourceDocument: true,
          deleteMessage: "Warning, Deleting the main file will also delete table of content and main files for the other languages of this entity" })),


        this.props.entityView && mainFile &&
        _jsx(_ViewDocButton.default, { file: mainFile, sharedId: parentSharedId, processed: this.props.processed, storeKey: storeKey })));



    }

    if (!forcedReadOnly) {
      return (
        _jsx(_Auth.NeedAuthorization, {}, void 0,
        _jsx("div", { className: "attachment-buttons main-file" }, void 0,
        _jsx("h2", {}, void 0,
        (0, _I18N.t)('System', 'Document'),
        _jsx(_Tip.default, {}, void 0, "Main file: add a file as the main content")),



        _jsx(_UploadButton.default, { documentId: parentId, documentSharedId: parentSharedId, storeKey: storeKey }))));



    }

    return null;
  }

  render() {
    const { parentId, parentSharedId, isDocumentAttachments, readOnly, storeKey } = this.props;
    const sortedFiles = this.arrangeFiles(this.props.files.toJS(), isDocumentAttachments);
    const forcedReadOnly = readOnly || Boolean(this.props.isTargetDoc);

    let uploadAttachmentButton = null;
    if (!this.props.isTargetDoc) {
      uploadAttachmentButton =
      _jsx(_Auth.NeedAuthorization, { roles: ['admin', 'editor'] }, void 0,
      _jsx("div", { className: "attachment-add" }, void 0,
      _jsx(_UploadAttachment.default, { entity: this.props.parentId, storeKey: storeKey })));



    }

    const mainFile = isDocumentAttachments ? sortedFiles[0] : null;
    const attachments = sortedFiles.filter((f, index) => mainFile && index !== 0 || !mainFile);
    return (
      _jsx("div", {}, void 0,
      this.renderMainDocument(mainFile),
      _jsx("h2", {}, void 0, (0, _I18N.t)('System', 'Attachments')),
      _jsx("div", { className: "attachments-list" }, void 0,
      attachments.map((file, index) =>
      _jsx(_Attachment.default, {

        file: file,
        parentId: parentId,
        readOnly: forcedReadOnly,
        storeKey: storeKey,
        parentSharedId: parentSharedId,
        isSourceDocument: false }, index))),



      uploadAttachmentButton));


  }}exports.AttachmentsList = AttachmentsList;


















AttachmentsList.contextTypes = {
  confirm: _propTypes.default.func };


function mapStateToProps({ user }) {
  return {
    user,
    progress: null,
    model: 'documentViewer.sidepanel.attachment' };

}var _default =

(0, _reactRedux.connect)(mapStateToProps)(AttachmentsList);exports.default = _default;