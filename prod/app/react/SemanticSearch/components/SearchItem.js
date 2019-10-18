"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapDispatchToProps = mapDispatchToProps;exports.default = exports.SearchItem = void 0;var _react = _interopRequireWildcard(require("react"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _reactRedux = require("react-redux");
var _redux = require("redux");

var _I18N = require("../../I18N");
var _SearchDescription = _interopRequireDefault(require("../../Library/components/SearchDescription"));
var _UI = require("../../UI");

var _actions = require("../actions/actions");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class SearchItem extends _react.Component {
  constructor(props) {
    super(props);
    this.delete = this.delete.bind(this);
  }

  delete(e) {
    const { confirm } = this.context;
    const { onDeleteClicked, search } = this.props;
    e.preventDefault();
    confirm({
      accept: onDeleteClicked.bind(this, search._id),
      title: 'Confirm delete',
      message: 'Are you sure you want to delete this search?' });

  }

  renderButtons() {
    const { search, onStopClicked, onResumeClicked } = this.props;
    const { status } = search;
    return (
      _jsx("div", { className: "buttons" }, void 0,
      _jsx("button", {
        type: "button",
        className: "btn btn-danger delete-search btn-xs",
        onClick: this.delete }, void 0,

      _jsx(_UI.Icon, { icon: "trash-alt", size: "sm" })),

      ['inProgress', 'pending'].includes(status) &&
      _jsx("button", {
        type: "button",
        className: "btn btn-warning stop-search btn-xs",
        onClick: () => onStopClicked(search._id) }, void 0,

      _jsx(_UI.Icon, { icon: "stop", size: "sm" })),


      status === 'stopped' &&
      _jsx("button", {
        type: "button",
        className: "btn btn-success resume-search btn-xs",
        onClick: () => onResumeClicked(search._id) }, void 0,

      _jsx(_UI.Icon, { icon: "play", size: "sm" }))));




  }

  render() {
    const { search } = this.props;
    const { status, documents } = search;
    const completed = documents.filter(doc => doc.status === 'completed').length;
    const max = documents.length;
    return (
      _jsx(_I18N.I18NLink, { className: "semantic-search-list-item", to: `semanticsearch/${search._id}` }, void 0,
      _jsx("div", { className: "item-header" }, void 0,
      _jsx("div", { className: "title" }, void 0, _jsx(_SearchDescription.default, { searchTerm: search.searchTerm, query: search.query })),
      this.renderButtons()),

      _jsx("div", {}, void 0,
      status !== 'completed' &&
      _jsx(_UI.ProgressBar, { value: completed, max: max }))));




  }}exports.SearchItem = SearchItem;


SearchItem.contextTypes = {
  confirm: _propTypes.default.func };














function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({
    onDeleteClicked: _actions.deleteSearch,
    onStopClicked: _actions.stopSearch,
    onResumeClicked: _actions.resumeSearch },
  dispatch);
}var _default =

(0, _reactRedux.connect)(null, mapDispatchToProps)(SearchItem);exports.default = _default;