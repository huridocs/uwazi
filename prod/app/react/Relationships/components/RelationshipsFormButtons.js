"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.RelationshipsFormButtons = void 0;
var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactRedux = require("react-redux");
var _redux = require("redux");

var _ShowIf = _interopRequireDefault(require("../../App/ShowIf"));
var _Auth = require("../../Auth");
var _I18N = require("../../I18N");
var _UI = require("../../UI");

var actions = _interopRequireWildcard(require("../actions/actions"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class RelationshipsFormButtons extends _react.Component {
  constructor(props) {
    super(props);
    this.edit = this.edit.bind(this);
  }

  edit(value) {
    return () => {
      this.props.edit(value, this.props.searchResults, this.props.parentEntity);
    };
  }

  render() {
    const { editing, saving } = this.props;

    return (
      _jsx("span", {}, void 0,
      _jsx(_Auth.NeedAuthorization, { roles: ['admin', 'editor'] }, void 0,
      _jsx(_ShowIf.default, { if: !editing }, void 0,
      _jsx("button", {
        onClick: this.edit(true),
        className: "edit-metadata btn btn-primary" }, void 0,

      _jsx(_UI.Icon, { icon: "pencil-alt" }),
      _jsx("span", { className: "btn-label" }, void 0, (0, _I18N.t)('System', 'Edit'))))),



      _jsx(_Auth.NeedAuthorization, { roles: ['admin', 'editor'] }, void 0,
      _jsx(_ShowIf.default, { if: editing }, void 0,
      _jsx("button", {
        onClick: this.edit(false),
        className: "cancel-edit-metadata btn btn-primary" }, void 0,

      _jsx(_UI.Icon, { icon: "times" }),
      _jsx("span", { className: "btn-label" }, void 0, (0, _I18N.t)('System', 'Cancel'))))),



      _jsx(_Auth.NeedAuthorization, { roles: ['admin', 'editor'] }, void 0,
      _jsx(_ShowIf.default, { if: editing }, void 0,
      _jsx("button", {
        onClick: this.props.save,
        className: "btn btn-success",
        disabled: saving }, void 0,

      _jsx(_UI.Icon, { icon: !saving ? 'save' : 'spinner', pulse: !!saving, fixedWidth: true }),
      _jsx("span", { className: "btn-label" }, void 0, (0, _I18N.t)('System', 'Save')))))));





  }}exports.RelationshipsFormButtons = RelationshipsFormButtons;











const mapStateToProps = ({ relationships }) => ({
  editing: relationships.hubActions.get('editing'),
  saving: relationships.hubActions.get('saving'),
  parentEntity: relationships.list.entity,
  searchResults: relationships.list.searchResults });


function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({
    edit: actions.edit,
    save: actions.saveRelationships },
  dispatch);
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(RelationshipsFormButtons);exports.default = _default;