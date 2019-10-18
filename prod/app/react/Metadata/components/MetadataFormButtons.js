"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.MetadataFormButtons = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactRedux = require("react-redux");
var _redux = require("redux");
var _Multireducer = require("../../Multireducer");

var _ShowIf = _interopRequireDefault(require("../../App/ShowIf"));
var _Auth = require("../../Auth");
var _I18N = require("../../I18N");
var _UI = require("../../UI");
var _uploadsActions = require("../../Uploads/actions/uploadsActions");
var _filterBaseProperties = _interopRequireDefault(require("../../Entities/utils/filterBaseProperties"));

var actions = _interopRequireWildcard(require("../actions/actions"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class MetadataFormButtons extends _react.Component {
  render() {
    const { entityBeingEdited, exclusivelyViewButton, formName } = this.props;
    const data = this.props.data.toJS();

    const ViewButton =
    _jsx(_I18N.I18NLink, { to: `${data.file ? 'document' : 'entity'}/${data.sharedId}` }, void 0,
    _jsx("button", { className: "edit-metadata btn btn-primary" }, void 0,
    _jsx(_UI.Icon, { icon: "file" }), _jsx("span", { className: "btn-label" }, void 0, (0, _I18N.t)('System', 'View'))));




    if (exclusivelyViewButton) {
      return _jsx("span", {}, void 0, ViewButton);
    }


    const _publish = e => {
      e.stopPropagation();
      this.context.confirm({
        accept: () => {
          this.props.publish(_filterBaseProperties.default.filterBaseProperties(data));
        },
        title: 'Confirm',
        message: 'Are you sure you want to publish this entity?',
        type: 'success' });

    };
    const _unpublish = e => {
      e.stopPropagation();
      this.context.confirm({
        accept: () => {
          this.props.unpublish(_filterBaseProperties.default.filterBaseProperties(data));
        },
        title: 'Confirm',
        message: 'Are you sure you want to unpublish this entity?',
        type: 'warning' });

    };
    const isEntity = !data.file;
    const canBePublished = (data.processed || isEntity) && !data.published && !!data.template;
    return (
      _jsx("span", {}, void 0,
      _jsx(_ShowIf.default, { if: this.props.includeViewButton }, void 0,
      ViewButton),

      _jsx(_Auth.NeedAuthorization, { roles: ['admin', 'editor'] }, void 0,
      _jsx(_ShowIf.default, { if: !entityBeingEdited }, void 0,
      _jsx("button", {
        onClick: () => this.props.loadInReduxForm(this.props.formStatePath, data, this.props.templates.toJS()),
        className: "edit-metadata btn btn-primary" }, void 0,

      _jsx(_UI.Icon, { icon: "pencil-alt" }),
      _jsx("span", { className: "btn-label" }, void 0, (0, _I18N.t)('System', 'Edit'))))),



      _jsx(_ShowIf.default, { if: entityBeingEdited }, void 0,
      _jsx("button", {
        onClick: () => this.props.resetForm(this.props.formStatePath),
        className: "cancel-edit-metadata btn btn-primary" }, void 0,

      _jsx(_UI.Icon, { icon: "times" }),
      _jsx("span", { className: "btn-label" }, void 0, (0, _I18N.t)('System', 'Cancel')))),


      _jsx(_ShowIf.default, { if: entityBeingEdited }, void 0,
      _jsx("button", { type: "submit", form: formName, className: "btn btn-success" }, void 0,
      _jsx(_UI.Icon, { icon: "save" }),
      _jsx("span", { className: "btn-label" }, void 0, (0, _I18N.t)('System', 'Save')))),


      _jsx(_Auth.NeedAuthorization, { roles: ['admin', 'editor'] }, void 0,
      _jsx(_ShowIf.default, { if: !entityBeingEdited }, void 0,
      _jsx("button", { className: "delete-metadata btn btn-danger", onClick: this.props.delete }, void 0,
      _jsx(_UI.Icon, { icon: "trash-alt" }),
      _jsx("span", { className: "btn-label" }, void 0, (0, _I18N.t)('System', 'Delete'))))),



      _jsx(_Auth.NeedAuthorization, { roles: ['admin', 'editor'] }, void 0,
      _jsx(_ShowIf.default, { if: !entityBeingEdited && canBePublished }, void 0,
      _jsx("button", { className: "publish btn btn-success", onClick: _publish }, void 0,
      _jsx(_UI.Icon, { icon: "paper-plane" }),
      _jsx("span", { className: "btn-label" }, void 0, (0, _I18N.t)('System', 'Publish'))))),



      _jsx(_Auth.NeedAuthorization, { roles: ['admin', 'editor'] }, void 0,
      _jsx(_ShowIf.default, { if: data.published }, void 0,
      _jsx("button", { className: "unpublish btn btn-warning", onClick: _unpublish }, void 0,
      _jsx(_UI.Icon, { icon: "paper-plane" }),
      _jsx("span", { className: "btn-label" }, void 0, (0, _I18N.t)('System', 'Unpublish')))))));





  }}exports.MetadataFormButtons = MetadataFormButtons;


MetadataFormButtons.contextTypes = {
  confirm: _propTypes.default.func };


MetadataFormButtons.defaultProps = {
  entityBeingEdited: false,
  formName: 'metadataForm',
  delete: () => {} };

















const mapStateToProps = ({ templates }) => ({ templates });

function mapDispatchToProps(dispatch, props) {
  return (0, _redux.bindActionCreators)({
    loadInReduxForm: actions.loadInReduxForm,
    resetForm: actions.resetReduxForm,
    publish: _uploadsActions.publish,
    unpublish: _uploadsActions.unpublish },
  (0, _Multireducer.wrapDispatch)(dispatch, props.storeKey));
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(MetadataFormButtons);exports.default = _default;