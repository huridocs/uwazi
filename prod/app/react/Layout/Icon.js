"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.Icon = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactRedux = require("react-redux");
var _reactFlags = _interopRequireDefault(require("react-flags"));
var _UI = require("../UI");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

function getPngSize(size) {
  switch (size) {
    case 'xs':
      return 16;
    case 'sm':
      return 24;
    case 'md':
      return 32;
    case 'lg':
      return 48;
    case 'xlg':
      return 64;
    default:
      return 16;}

}

function getFaSize(size) {
  switch (size) {
    case 'xs':
      return 'sm';
    case 'sm':
      return 'lg';
    case 'md':
      return '2x';
    case 'lg':
      return '2x';
    case 'xlg':
      return '2x';
    default:
      return 'sm';}

}

class Icon extends _react.Component {
  render() {
    const { data, className, size } = this.props;
    let html = null;
    let _data = data;

    if (data && _data.toJS) {
      _data = _data.toJS();
    }

    if (_data && _data._id) {
      let icon;

      if (_data.type === 'Icons') {
        icon = _jsx(_UI.Icon, { icon: `${_data._id}`, size: `${getFaSize(size)}` });
      }

      if (_data.type === 'Flags') {
        icon =
        _jsx(_reactFlags.default, {
          name: _data._id,
          format: "png",
          pngSize: getPngSize(size),
          shiny: true,
          alt: `${_data.label} flag`,
          basePath: "/flag-images" });


      }

      html = _jsx("span", { className: className }, void 0, icon);
    }

    return html;
  }}exports.Icon = Icon;var _default =








(0, _reactRedux.connect)()(Icon);exports.default = _default;