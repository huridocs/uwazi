"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapStateToProps = mapStateToProps;exports.default = exports.LeftRelationship = void 0;var _redux = require("redux");
var _reactRedux = require("react-redux");
var _reselect = require("reselect");
var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _immutable = require("immutable");
var _UI = require("../../UI");

var _Doc = _interopRequireDefault(require("../../Library/components/Doc"));
var _DropdownList = _interopRequireDefault(require("../../Forms/components/DropdownList"));

var actions = _interopRequireWildcard(require("../actions/actions"));

var _HubRelationshipMetadata = _interopRequireDefault(require("./HubRelationshipMetadata"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class LeftRelationship extends _react.Component {
  static renderFigure() {
    return (
      _jsx("div", { className: "hubRelationship" }, "figure",
      _jsx("figure", {})));


  }

  constructor(props) {
    super(props);
    this.toggelRemoveLeftRelationship = this.props.toggelRemoveLeftRelationship.bind(null, props.index);
    this.onClick = this.onClick.bind(this);
  }

  onClick(e, entity) {
    this.props.selectConnection(entity);
  }

  renderTrashButton(hub) {
    return this.props.editing &&
    _jsx("div", { className: "removeHub" }, "toggelRemoveLeftRelationship",
    _jsx("button", {
      onClick: this.toggelRemoveLeftRelationship,
      className: "relationships-icon" }, void 0,

    _jsx(_UI.Icon, { icon: !hub.get('deleted') ? 'trash-alt' : 'undo' })));



  }

  renderRelationship() {
    const { parentEntity, hub, search, editing, relationTypes, index } = this.props;
    const relationship = hub.get('leftRelationship');
    const targetReference = relationship.get('range') ? relationship : null;
    return (
      _jsx("div", { className: `leftRelationshipType ${hub.get('deleted') ? 'deleted' : ''}` }, "leftRelationshipType",
      !editing && hub.getIn(['leftRelationship', 'template']) &&

      _jsx("div", { className: "rw-dropdown-list rw-widget" }, void 0,
      _jsx("div", { className: "rw-widget-input rw-widget-picker rw-widget-container no-edit" }, void 0,
      _jsx("div", { className: "rw-input rw-dropdown-list-input no-edit" }, void 0,
      relationTypes.find(r => r._id === hub.getIn(['leftRelationship', 'template'])).name))),





      editing &&

      _jsx(_DropdownList.default, {
        valueField: "_id",
        textField: "name",
        data: relationTypes,
        value: hub.getIn(['leftRelationship', 'template']),
        filter: "contains",
        onChange: this.props.updateLeftRelationshipType.bind(null, index) }),



      _jsx("div", { className: `leftDocument ${!hub.getIn(['leftRelationship', 'template']) && !editing ?
        'docWithoutRelationshipType' : ''}` }, void 0,

      _jsx(_Doc.default, {
        className: "item-collapsed",
        doc: parentEntity,
        searchParams: search,
        onClick: this.onClick,
        targetReference: targetReference })),


      _jsx(_HubRelationshipMetadata.default, { relationship: hub.get('leftRelationship') })));


  }

  render() {
    const { hub, index, parentEntity } = this.props;
    if (!parentEntity.get('sharedId')) {
      return false;
    }
    return (
      _jsx(_react.Fragment, {}, void 0,
      this.renderTrashButton(hub, index),
      this.renderRelationship(),
      LeftRelationship.renderFigure()));


  }}exports.LeftRelationship = LeftRelationship;














const selectRelationTypes = (0, _reselect.createSelector)(
state => state.relationTypes,
relationTypes => [{ _id: null, name: 'No label' }].concat(relationTypes.toJS()));


function mapStateToProps(state) {
  const { relationships } = state;
  return {
    parentEntity: relationships.list.entity,
    search: relationships.list.sort,
    editing: relationships.hubActions.get('editing'),
    relationTypes: selectRelationTypes(state) };

}

function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({
    selectConnection: actions.selectConnection,
    updateLeftRelationshipType: actions.updateLeftRelationshipType,
    toggelRemoveLeftRelationship: actions.toggelRemoveLeftRelationship },
  dispatch);
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(LeftRelationship);exports.default = _default;