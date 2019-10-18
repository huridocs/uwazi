"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapStateToProps = mapStateToProps;exports.default = exports.RelationshipsGraphEdit = void 0;var _redux = require("redux");
var _reactRedux = require("react-redux");
var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _immutable = require("immutable");
var _UI = require("../../UI");
var actions = _interopRequireWildcard(require("../actions/actions"));

var _LeftRelationship = _interopRequireDefault(require("./LeftRelationship"));
var _RightRelationship = _interopRequireDefault(require("./RightRelationship"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class RelationshipsGraphEdit extends _react.Component {
  componentWillMount() {
    this.props.parseResults(this.props.searchResults, this.props.parentEntity, this.props.editing);
  }

  componentWillUpdate(nextProps) {
    if (this.props.searchResults !== nextProps.searchResults) {
      this.props.parseResults(nextProps.searchResults, nextProps.parentEntity, this.props.editing);
    }
  }

  render() {
    const { hubs, addHub } = this.props;
    return (
      _jsx("div", { className: "relationships-graph" }, void 0,

      _jsx("div", {}, void 0,
      hubs.map((hub, index) =>
      _jsx("div", { className: "relationshipsHub" }, index,
      _jsx(_LeftRelationship.default, { index: index, hub: hub }),
      _jsx(_RightRelationship.default, { index: index, hub: hub }))),



      this.props.editing &&
      _jsx("div", { className: "relationshipsHub" }, void 0,
      _jsx("div", { className: "leftRelationshipType " }, void 0,
      _jsx("button", { className: "relationships-new", onClick: addHub }, void 0,
      _jsx("span", {}, void 0, "New relationships group"),
      _jsx(_UI.Icon, { icon: "plus" })))))));









  }}exports.RelationshipsGraphEdit = RelationshipsGraphEdit;











function mapStateToProps(state) {
  const { relationships } = state;
  return {
    parentEntity: relationships.list.entity,
    searchResults: relationships.list.searchResults,
    search: relationships.list.sort,
    hubs: relationships.hubs,
    editing: relationships.hubActions.get('editing') };

}

function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({
    parseResults: actions.parseResults,
    addHub: actions.addHub },
  dispatch);
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(RelationshipsGraphEdit);exports.default = _default;