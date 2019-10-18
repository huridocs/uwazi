"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapStateToProps = mapStateToProps;exports.default = exports.Attachment = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactRedux = require("react-redux");
var _redux = require("redux");

var _filesize = _interopRequireDefault(require("filesize"));
var _Auth = require("../../Auth");
var _ShowIf = _interopRequireDefault(require("../../App/ShowIf"));

var _UploadButton = _interopRequireDefault(require("../../Metadata/components/UploadButton"));
var _AttachmentForm = _interopRequireDefault(require("./AttachmentForm"));
var _UI = require("../../UI");

var _actions = require("../actions/actions");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

const getExtension = filename => filename.substr(filename.lastIndexOf('.') + 1);

const getItemOptions = (isSourceDocument, parentId, filename) => {
  const options = {};
  options.itemClassName = isSourceDocument ? 'item-source-document' : '';
  options.typeClassName = isSourceDocument ? 'primary' : 'empty';
  options.icon = isSourceDocument ? 'file-pdf-o' : 'paperclip';
  options.deletable = true;
  options.replaceable = isSourceDocument;
  options.downloadHref = isSourceDocument ?
  `/api/documents/download?_id=${parentId}` :
  `/api/attachments/download?_id=${parentId}&file=${filename}`;

  return options;
};

const conformThumbnail = (file, item) => {
  const acceptedThumbnailExtensions = ['png', 'gif', 'jpg'];
  let thumbnail = null;

  if (getExtension(file.filename) === 'pdf') {
    thumbnail = _jsx("span", {}, void 0, _jsx(_UI.Icon, { icon: "file-pdf" }), " pdf");
  }

  if (acceptedThumbnailExtensions.indexOf(getExtension(file.filename.toLowerCase())) !== -1) {
    thumbnail = _jsx("img", { src: item.downloadHref, alt: file.filename });
  }

  return _jsx("div", { className: "attachment-thumbnail" }, void 0, thumbnail);
};

class Attachment extends _react.Component {
  deleteAttachment(attachment) {
    this.context.confirm({
      accept: () => {
        this.props.deleteAttachment(this.props.parentId, attachment, this.props.storeKey);
      },
      title: 'Confirm delete',
      message: this.props.deleteMessage });

  }

  render() {
    const { file, parentId, parentSharedId, model, isSourceDocument, storeKey } = this.props;
    const sizeString = file.size ? (0, _filesize.default)(file.size) : '';
    const item = getItemOptions(isSourceDocument, parentId, file.filename);

    let name =
    _jsx("a", { className: "attachment-link", href: item.downloadHref }, void 0,
    conformThumbnail(file, item),
    _jsx("span", { className: "attachment-name" }, void 0,
    _jsx("span", {}, void 0, file.originalname),
    _jsx(_ShowIf.default, { if: Boolean(sizeString) }, void 0,
    _jsx("span", { className: "attachment-size" }, void 0, sizeString))));





    let buttons =
    _jsx("div", {}, void 0,
    _jsx(_Auth.NeedAuthorization, { roles: ['admin', 'editor'] }, void 0,
    _jsx("div", { className: "attachment-buttons" }, void 0,
    _jsx(_ShowIf.default, { if: !this.props.readOnly }, void 0,
    _jsx("button", { className: "item-shortcut btn btn-default", onClick: this.props.loadForm.bind(this, model, file) }, void 0,
    _jsx(_UI.Icon, { icon: "pencil-alt" }))),


    _jsx(_ShowIf.default, { if: item.deletable && !this.props.readOnly }, void 0,
    _jsx("button", { className: "item-shortcut btn btn-default btn-hover-danger", onClick: this.deleteAttachment.bind(this, file) }, void 0,
    _jsx(_UI.Icon, { icon: "trash-alt" }))),


    _jsx(_ShowIf.default, { if: item.replaceable && !this.props.readOnly }, void 0,
    _jsx(_UploadButton.default, { documentId: parentId, documentSharedId: parentSharedId, storeKey: storeKey })))));






    if (this.props.beingEdited && !this.props.readOnly) {
      name =
      _jsx("div", { className: "attachment-link" }, void 0,
      conformThumbnail(file, item),
      _jsx("span", { className: "attachment-name" }, void 0,
      _jsx(_AttachmentForm.default, {
        model: this.props.model,
        isSourceDocument: isSourceDocument,
        onSubmit: this.props.renameAttachment.bind(this, parentId, model, storeKey) })));





      buttons =
      _jsx("div", { className: "attachment-buttons" }, void 0,
      _jsx("div", { className: "item-shortcut-group" }, void 0,
      _jsx(_Auth.NeedAuthorization, { roles: ['admin', 'editor'] }, void 0,
      _jsx("button", { className: "item-shortcut btn btn-primary", onClick: this.props.resetForm.bind(this, model) }, void 0,
      _jsx(_UI.Icon, { icon: "times" }))),


      _jsx(_Auth.NeedAuthorization, { roles: ['admin', 'editor'] }, void 0,
      _jsx("button", { className: "item-shortcut btn btn-success", onClick: this.props.submitForm.bind(this, model, storeKey) }, void 0,
      _jsx(_UI.Icon, { icon: "save" })))));





    }


    return (
      _jsx("div", { className: "attachment" }, void 0,
      name,
      buttons));


  }}exports.Attachment = Attachment;


Attachment.defaultProps = {
  deleteMessage: 'Are you sure you want to delete this attachment?' };



















Attachment.contextTypes = {
  confirm: _propTypes.default.func };


function mapStateToProps({ attachments }, ownProps) {
  return {
    model: 'attachments.edit.attachment',
    beingEdited: ownProps.file._id && attachments.edit.attachment._id === ownProps.file._id };

}

function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({ deleteAttachment: _actions.deleteAttachment, renameAttachment: _actions.renameAttachment, loadForm: _actions.loadForm, submitForm: _actions.submitForm, resetForm: _actions.resetForm }, dispatch);
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(Attachment);exports.default = _default;