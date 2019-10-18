"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.mapStateToProps = exports.AddEntities = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactRedux = require("react-redux");
var _redux = require("redux");

var _SidePanel = _interopRequireDefault(require("../../Layout/SidePanel"));
var _SearchResults = _interopRequireDefault(require("../../Connections/components/SearchResults"));
var _UI = require("../../UI");
var _uiActions = require("../actions/uiActions");
var _SearchEntitiesForm = _interopRequireDefault(require("./SearchEntitiesForm"));
var actions = _interopRequireWildcard(require("../actions/actions"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class AddEntities extends _react.Component {
  constructor(props) {
    super(props);
    this.addEntity = this.addEntity.bind(this);
  }

  addEntity(sharedId, entity) {
    this.props.addEntity(this.props.hubIndex, this.props.rightRelationshipIndex, entity);
  }

  render() {
    const { uiState, searchResults } = this.props;
    const open = Boolean(this.props.uiState.get('open'));

    return (
      _jsx(_SidePanel.default, { open: open, className: "create-reference" }, void 0,
      _jsx("div", { className: "sidepanel-header" }, void 0,
      _jsx("h1", {}, void 0, "Add entities / documents"),
      _jsx("button", { className: "closeSidepanel close-modal", onClick: this.props.closePanel }, void 0,
      _jsx(_UI.Icon, { icon: "times" }))),



      _jsx("div", { className: "sidepanel-body" }, void 0,
      _jsx("div", { className: "search-box" }, void 0,
      _jsx(_SearchEntitiesForm.default, {})),

      _jsx(_SearchResults.default, {
        results: searchResults,
        searching: uiState.get('searching'),
        onClick: this.addEntity }))));




  }}exports.AddEntities = AddEntities;











const mapStateToProps = ({ relationships }) => ({
  uiState: relationships.uiState,
  searchResults: relationships.searchResults,
  hubIndex: relationships.hubActions.getIn(['addTo', 'hubIndex']),
  rightRelationshipIndex: relationships.hubActions.getIn(['addTo', 'rightRelationshipIndex']) });exports.mapStateToProps = mapStateToProps;


function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({ addEntity: actions.addEntity, closePanel: _uiActions.closePanel }, dispatch);
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(AddEntities);exports.default = _default;