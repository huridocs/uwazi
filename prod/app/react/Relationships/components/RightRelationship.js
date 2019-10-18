"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapStateToProps = mapStateToProps;exports.default = exports.RightRelationship = void 0;var _redux = require("redux");
var _reactRedux = require("react-redux");
var _reselect = require("reselect");
var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _UI = require("../../UI");

var _Doc = _interopRequireDefault(require("../../Library/components/Doc"));
var _DropdownList = _interopRequireDefault(require("../../Forms/components/DropdownList"));

var actions = _interopRequireWildcard(require("../actions/actions"));
var uiActions = _interopRequireWildcard(require("../actions/uiActions"));

var _HubRelationshipMetadata = _interopRequireDefault(require("./HubRelationshipMetadata"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class RightRelationship extends _react.Component {
  constructor(props) {
    super(props);

    this.updateRightRelationshipType = this.updateRightRelationshipType.bind(this);
    this.toggleRemoveRightRelationshipGroup = this.toggleRemoveRightRelationshipGroup.bind(this);
    this.toggleRemoveEntity = this.toggleRemoveEntity.bind(this);
    this.setAddToData = this.setAddToData.bind(this);
    this.onClick = this.onClick.bind(this);
  }

  onClick(e, entity) {
    this.props.selectConnection(entity);
  }

  setAddToData(hubIndex, rightRelationshipIndex) {
    return () => {
      this.props.setAddToData(hubIndex, rightRelationshipIndex);
      this.props.openAddEntitiesPanel();
    };
  }

  updateRightRelationshipType(index, rightRelationshipIndex) {
    return value => {
      this.props.updateRightRelationshipType(index, rightRelationshipIndex, value._id);
    };
  }

  toggleRemoveRightRelationshipGroup(index, rightRelationshipIndex) {
    return () => {
      this.props.toggleRemoveRightRelationshipGroup(index, rightRelationshipIndex);
    };
  }

  toggleRemoveEntity(index, rightRelationshipIndex, relationshipIndex) {
    return () => {
      this.props.toggleRemoveEntity(index, rightRelationshipIndex, relationshipIndex);
    };
  }

  render() {
    const { hub, index, search, hubActions, relationTypes } = this.props;
    const editing = hubActions.get('editing');
    return (
      _jsx("div", { className: "rightRelationships" }, void 0,
      hub.get('rightRelationships').map((rightRelationshipGroup, rightRelationshipIndex) =>
      _jsx("div", {
        className: `rightRelationshipsTypeGroup ${rightRelationshipGroup.get('deleted') ? 'deleted' : ''}` },
      rightRelationshipIndex,

      _jsx("div", { className: `rightRelationshipType
                             ${rightRelationshipIndex === hub.get('rightRelationships').size - 1 ? 'last-of-type' : ''}` }, void 0,

      !editing &&
      _jsx("div", { className: "rw-dropdown-list rw-widget no-edit" }, void 0,
      _jsx("div", { className: "rw-widget-input rw-widget-picker rw-widget-container no-edit" }, void 0,
      _jsx("div", { className: "rw-input rw-dropdown-list-input no-edit" }, void 0,
      (() => {
        if (relationTypes.find(r => r._id === rightRelationshipGroup.get('template'))) {
          return rightRelationshipGroup.get('template') ?
          relationTypes.find(r => r._id === rightRelationshipGroup.get('template')).name :
          _jsx(_UI.Icon, { icon: "link" });
        }
        return null;
      })()))),




      editing &&
      _jsx(_DropdownList.default, {
        valueField: "_id",
        textField: "name",
        data: relationTypes,
        value: rightRelationshipGroup.get('template'),
        placeholder: "New connection type",
        filter: "contains",
        onChange: this.updateRightRelationshipType(index, rightRelationshipIndex) })),



      editing &&
      _jsx("div", { className: "removeRightRelationshipGroup" }, void 0,
      (() => {
        if (rightRelationshipGroup.has('template')) {
          return (
            _jsx("button", {
              onClick: this.toggleRemoveRightRelationshipGroup(index, rightRelationshipIndex),
              className: "relationships-icon" }, void 0,

            _jsx(_UI.Icon, { icon: !rightRelationshipGroup.get('deleted') ? 'trash-alt' : 'undo' })));


        }

        return _jsx("span", {}, void 0, "\xA0");
      })()),


      rightRelationshipGroup.get('relationships').map((relationship, relationshipIndex) => {
        if (relationship.get('moved')) {
          return false;
        }
        const rightRelationshipDeleted = rightRelationshipGroup.get('deleted');
        const deleted = relationship.get('deleted');
        const move = relationship.get('move');
        return (
          _jsx("div", {
            className: `rightRelationship ${!rightRelationshipDeleted && deleted ? 'deleted' : ''} ${move ? 'move' : ''}` },
          relationshipIndex,

          _jsx("div", { className: "rightRelationshipType" }, void 0,
          _jsx(_Doc.default, {
            className: "item-collapsed",
            doc: relationship.get('entityData'),
            searchParams: search,
            onClick: this.onClick,
            targetReference: relationship.get('range') ? relationship : null }),

          _jsx(_HubRelationshipMetadata.default, { relationship: relationship })),

          editing &&
          _jsx("div", { className: "removeEntity" }, void 0,
          _jsx("button", {
            onClick: this.toggleRemoveEntity(index, rightRelationshipIndex, relationshipIndex),
            className: "relationships-icon" }, void 0,

          _jsx(_UI.Icon, { icon: !deleted ? 'trash-alt' : 'undo' }))),



          editing &&
          _jsx("div", { className: "moveEntity" }, void 0,
          _jsx("button", {
            onClick: this.props.toggleMoveEntity.bind(this, index, rightRelationshipIndex, relationshipIndex),
            className: `relationships-icon ${!move ? '' : 'moving'}` }, void 0,

          _jsx(_UI.Icon, { icon: "check" })))));





      }),
      (() => {
        if (editing && rightRelationshipGroup.has('template')) {
          const isActive = hubActions.getIn(['addTo', 'hubIndex']) === index &&
          hubActions.getIn(['addTo', 'rightRelationshipIndex']) === rightRelationshipIndex;
          return (
            _jsx("div", { className: "rightRelationshipAdd" }, void 0,
            _jsx("button", {
              className: `relationships-new ${isActive ? 'is-active' : ''}`,
              onClick: this.setAddToData(index, rightRelationshipIndex) }, void 0,

            _jsx("span", {}, void 0, "Add entities / documents"),
            _jsx(_UI.Icon, { icon: "plus" })),

            _jsx("div", { className: "insertEntities" }, void 0,
            _jsx("button", {
              onClick: this.props.moveEntities.bind(this, index, rightRelationshipIndex),
              className: "relationships-icon" }, void 0,

            _jsx(_UI.Icon, { icon: "arrow-left" })))));




        }

        return null;
      })()))));





  }}exports.RightRelationship = RightRelationship;


















const selectRelationTypes = (0, _reselect.createSelector)(
state => state.relationTypes,
relationTypes => [{ _id: null, name: 'No label' }].concat(relationTypes.toJS()));


function mapStateToProps(state) {
  const { relationships } = state;
  return {
    search: relationships.list.sort,
    hubs: relationships.hubs,
    hubActions: relationships.hubActions,
    relationTypes: selectRelationTypes(state) };

}

function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({
    selectConnection: actions.selectConnection,
    updateRightRelationshipType: actions.updateRightRelationshipType,
    toggleRemoveRightRelationshipGroup: actions.toggleRemoveRightRelationshipGroup,
    setAddToData: actions.setAddToData,
    toggleRemoveEntity: actions.toggleRemoveEntity,
    moveEntities: actions.moveEntities,
    toggleMoveEntity: actions.toggleMoveEntity,
    openAddEntitiesPanel: uiActions.openPanel },
  dispatch);
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(RightRelationship);exports.default = _default;