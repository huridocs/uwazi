"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.ConnectionsList = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactRedux = require("react-redux");
var _redux = require("redux");
var _I18N = require("../../I18N");
var _UI = require("../../UI");

var _uiActions = require("../actions/uiActions");
var _Connection = _interopRequireDefault(require("./Connection"));

require("../scss/viewReferencesPanel.scss");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class ConnectionsList extends _react.Component {
  static blankStateMessage(title, message) {
    return (
      _jsx("div", { className: "blank-state" }, void 0,
      _jsx(_UI.Icon, { icon: "sitemap" }),
      _jsx("h4", {}, void 0, (0, _I18N.t)('System', title)),
      _jsx("p", {}, void 0, (0, _I18N.t)('System', message))));


  }

  close() {
    this.props.closePanel();
    this.props.deactivateReference();
  }

  render() {
    const references = this.props.references.toJS().sort((a, b) => {
      const aStart = typeof a.range.start !== 'undefined' ? a.range.start : -1;
      const bStart = typeof b.range.start !== 'undefined' ? b.range.start : -1;
      return aStart - bStart;
    });

    if (this.props.loading) {
      return false;
    }

    if (!this.props.references.size && this.props.referencesSection === 'references') {
      return ConnectionsList.blankStateMessage('No References', 'No References description');
    }

    if (!this.props.references.size) {
      return ConnectionsList.blankStateMessage('No Connections', 'No Connections description');
    }

    return (
      _jsx("div", { className: "item-group" }, void 0,
      (() => references.map(reference => _jsx(_Connection.default, { readOnly: this.props.readOnly, reference: reference }, reference._id)))()));


  }}exports.ConnectionsList = ConnectionsList;











function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({ closePanel: _uiActions.closePanel, deactivateReference: _uiActions.deactivateReference }, dispatch);
}var _default =

(0, _reactRedux.connect)(null, mapDispatchToProps)(ConnectionsList);exports.default = _default;