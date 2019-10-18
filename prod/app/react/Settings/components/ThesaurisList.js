"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapStateToProps = mapStateToProps;exports.default = exports.ThesaurisList = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactRedux = require("react-redux");
var _redux = require("redux");
var _I18N = require("../../I18N");
var _thesaurisActions = require("../../Thesauris/actions/thesaurisActions");
var _UI = require("../../UI");

var _Notifications = require("../../Notifications");

var _sortThesauri = _interopRequireDefault(require("../utils/sortThesauri"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class ThesaurisList extends _react.Component {
  deleteThesauri(thesauri) {
    return this.props.checkThesauriCanBeDeleted(thesauri).
    then(() => {
      this.context.confirm({
        accept: () => {
          this.props.deleteThesauri(thesauri);
        },
        title: `Confirm delete thesaurus: ${thesauri.name}`,
        message: 'Are you sure you want to delete this thesaurus?' });

    }).
    catch(() => {
      this.context.confirm({
        accept: () => {},
        noCancel: true,
        title: `Cannot delete thesaurus: ${thesauri.name}`,
        message: 'This thesaurus is being used in document types and cannot be deleted.' });

    });
  }

  render() {
    return (
      _jsx("div", { className: "panel panel-default" }, void 0,
      _jsx("div", { className: "panel-heading" }, void 0, (0, _I18N.t)('System', 'Thesauri')),
      _jsx("ul", { className: "list-group" }, void 0,
      (0, _sortThesauri.default)(this.props.dictionaries.toJS()).map((dictionary, index) =>
      _jsx("li", { className: "list-group-item" }, index,
      _jsx(_I18N.I18NLink, { to: `/settings/dictionaries/edit/${dictionary._id}` }, void 0, dictionary.name),
      _jsx("div", { className: "list-group-item-actions" }, void 0,
      _jsx(_I18N.I18NLink, { to: `/settings/dictionaries/edit/${dictionary._id}`, className: "btn btn-default btn-xs" }, void 0,
      _jsx(_UI.Icon, { icon: "pencil-alt" }), "\xA0",
      _jsx("span", {}, void 0, (0, _I18N.t)('System', 'Edit'))),

      _jsx("a", { onClick: this.deleteThesauri.bind(this, dictionary), className: "btn btn-danger btn-xs template-remove" }, void 0,
      _jsx(_UI.Icon, { icon: "trash-alt" }), "\xA0",
      _jsx("span", {}, void 0, (0, _I18N.t)('System', 'Delete'))))))),





      _jsx("div", { className: "settings-footer" }, void 0,
      _jsx(_I18N.I18NLink, { to: "/settings/dictionaries/new", className: "btn btn-success" }, void 0,
      _jsx(_UI.Icon, { icon: "plus" }),
      _jsx("span", { className: "btn-label" }, void 0, (0, _I18N.t)('System', 'Add thesaurus'))))));




  }}exports.ThesaurisList = ThesaurisList;









ThesaurisList.contextTypes = {
  confirm: _propTypes.default.func };


function mapStateToProps(state) {
  return { dictionaries: state.dictionaries };
}

function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({ notify: _Notifications.notificationActions.notify, deleteThesauri: _thesaurisActions.deleteThesauri, checkThesauriCanBeDeleted: _thesaurisActions.checkThesauriCanBeDeleted }, dispatch);
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(ThesaurisList);exports.default = _default;