"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapStateToProps = mapStateToProps;exports.default = exports.UsersList = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactRedux = require("react-redux");
var _I18N = require("../../I18N");
var _redux = require("redux");

var _actions = require("../actions/actions");

var _UI = require("../../UI");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}


class UsersList extends _react.Component {
  deleteUser(user) {
    return this.context.confirm({
      accept: () => {
        this.props.deleteUser({ _id: user.get('_id'), sharedId: user.get('sharedId') });
      },
      title: `Confirm delete user: ${user.get('username')}`,
      message: 'Are you sure you want to delete this user?' });

  }

  render() {
    const { users } = this.props;

    return (
      _jsx("div", { className: "panel panel-default" }, void 0,
      _jsx("div", { className: "panel-heading" }, void 0, (0, _I18N.t)('System', 'Users')),
      _jsx("ul", { className: "list-group users" }, void 0,
      users.map((user, index) =>
      _jsx("li", { className: "list-group-item" }, index,
      _jsx("span", {}, void 0, user.get('username')),
      _jsx("div", { className: "list-group-item-actions" }, void 0,
      _jsx(_I18N.I18NLink, { to: `/settings/users/edit/${user.get('_id')}`, className: "btn btn-default btn-xs" }, void 0,
      _jsx(_UI.Icon, { icon: "pencil-alt" }), "\xA0",
      _jsx("span", {}, void 0, (0, _I18N.t)('System', 'Edit'))),

      _jsx("a", { onClick: this.deleteUser.bind(this, user), className: "btn btn-danger btn-xs template-remove" }, void 0,
      _jsx(_UI.Icon, { icon: "trash-alt" }), "\xA0",
      _jsx("span", {}, void 0, (0, _I18N.t)('System', 'Delete'))))))),






      _jsx("div", { className: "settings-footer" }, void 0,
      _jsx(_I18N.I18NLink, { to: "/settings/users/new", className: "btn btn-success" }, void 0,
      _jsx(_UI.Icon, { icon: "plus" }),
      _jsx("span", { className: "btn-label" }, void 0, (0, _I18N.t)('System', 'Add user'))))));




  }}exports.UsersList = UsersList;







UsersList.contextTypes = {
  confirm: _propTypes.default.func };


function mapStateToProps({ users }) {
  return { users };
}

function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({ deleteUser: _actions.deleteUser }, dispatch);
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(UsersList);exports.default = _default;