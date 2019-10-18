"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapStateToProps = mapStateToProps;exports.default = exports.ActionButton = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactRedux = require("react-redux");
var _redux = require("redux");

var _validate = _interopRequireDefault(require("validate.js"));
var _UI = require("../../UI");
var _actions = require("../actions/actions");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class ActionButton extends _react.Component {
  onClick(enabled, connection) {
    if (enabled) {
      if (this.props.action === 'save') {
        this.props.saveConnection(connection, this.props.onCreate);
      }
      if (this.props.action === 'connect') {
        this.props.selectRangedTarget(connection, this.props.onRangedConnect);
      }
    }
  }

  render() {
    const connection = this.props.connection.toJS();
    const validator = {
      sourceDocument: { presence: true },
      targetDocument: { presence: true },
      template: { presence: true } };


    if (this.props.type === 'basic') {
      delete connection.sourceRange;
    }

    if (this.props.type !== 'basic') {
      validator.sourceRange = { presence: true };
    }

    const connectionValid = !(0, _validate.default)(connection, validator);
    const enabled = connectionValid && !this.props.busy;
    const buttonClass = this.props.action === 'save' ? 'btn btn-success' : 'edit-metadata btn btn-success';
    let buttonIcon = 'arrow-right';
    if (this.props.busy) {
      buttonIcon = 'spinner';
    }
    if (this.props.action === 'save') {
      buttonIcon = 'save';
    }

    return (
      _jsx("button", {
        className: buttonClass,
        disabled: !enabled,
        onClick: this.onClick.bind(this, enabled, connection) }, void 0,

      _jsx(_UI.Icon, { icon: buttonIcon, spin: !!this.props.busy })));


  }}exports.ActionButton = ActionButton;













function mapStateToProps({ connections }) {
  return {
    type: connections.connection.get('type'),
    connection: connections.connection,
    busy: connections.uiState.get('creating') || connections.uiState.get('connecting') };

}

function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({ saveConnection: _actions.saveConnection, selectRangedTarget: _actions.selectRangedTarget }, dispatch);
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(ActionButton);exports.default = _default;