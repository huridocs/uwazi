"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.MetadataPanelMenu = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactRedux = require("react-redux");
var _redux = require("redux");

var _Metadata = require("../../Metadata");
var _ContextMenu = require("../../ContextMenu");
var _Auth = require("../../Auth");
var _UI = require("../../UI");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class MetadataPanelMenu extends _react.Component {
  render() {
    if (this.props.targetDoc) {
      return false;
    }
    return (
      _jsx("div", {}, void 0,
      (() => {
        if (this.props.docForm && this.props.docForm._id) {
          let disabled = true;
          if (this.props.formState.dirty) {
            disabled = false;
          }

          return (
            _jsx(_ContextMenu.MenuButtons.Main, { disabled: disabled }, void 0,
            _jsx("button", { type: "submit", form: "metadataForm", disabled: disabled }, void 0,
            _jsx(_UI.Icon, { icon: "save" }))));



        }
        return (
          _jsx(_Auth.NeedAuthorization, { roles: ['admin', 'editor'] }, void 0,
          _jsx(_ContextMenu.MenuButtons.Main, {
            onClick: () => this.props.loadInReduxForm('documentViewer.docForm', this.props.doc.toJS(), this.props.templates.toJS()) }, void 0,

          _jsx(_UI.Icon, { icon: "pencil-alt" }))));



      })()));


  }}exports.MetadataPanelMenu = MetadataPanelMenu;











const mapStateToProps = ({ documentViewer, templates }) => ({
  doc: documentViewer.doc,
  templates,
  docForm: documentViewer.docForm,
  formState: documentViewer.docFormState,
  targetDoc: !!documentViewer.targetDoc.get('_id') });


function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({ loadInReduxForm: _Metadata.actions.loadInReduxForm }, dispatch);
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(MetadataPanelMenu);exports.default = _default;