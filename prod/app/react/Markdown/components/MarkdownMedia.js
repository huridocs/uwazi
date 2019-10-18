"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _react = _interopRequireWildcard(require("react"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _reactPlayer = _interopRequireDefault(require("react-player"));
var _UI = require("../../UI");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _extends() {_extends = Object.assign || function (target) {for (var i = 1; i < arguments.length; i++) {var source = arguments[i];for (var key in source) {if (Object.prototype.hasOwnProperty.call(source, key)) {target[key] = source[key];}}}return target;};return _extends.apply(this, arguments);}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

const propsToConfig = props => {
  const config = { url: '', options: {} };

  let parsedProps = props.config.replace(/\(|\)/g, '').split(',');
  config.url = parsedProps.shift();

  parsedProps = (parsedProps.join(',') || '{}').replace(/&quot;/g, '"');

  try {
    parsedProps = JSON.parse(parsedProps);
  } catch (error) {
    parsedProps = {};
  }

  config.options = parsedProps;

  return config;
};

class MarkdownMedia extends _react.Component {
  timeLinks(_timelinks) {
    const timelinks = _timelinks || {};
    return Object.keys(timelinks).map((timeKey, index) => {
      const seconds = timeKey.split(':').reverse().reduce((_seconds, n, _index) => _seconds + parseInt(n, 10) * 60 ** _index, 0);
      return (
        _jsx("div", { className: "timelink", onClick: this.seekTo.bind(this, seconds) }, index,
        _jsx("b", {}, void 0, _jsx(_UI.Icon, { icon: "play" }), " ", timeKey),
        _jsx("span", {}, void 0, timelinks[timeKey])));


    });
  }

  seekTo(seconds) {
    this.player.seekTo(seconds);
  }

  render() {
    const config = propsToConfig(this.props);
    const { compact } = this.props;
    const dimensions = { width: '100%' };
    if (compact) {
      dimensions.height = '100%';
    }
    return (
      _jsx("div", { className: `video-container ${compact ? 'compact' : ''}` }, void 0,
      _jsx("div", {}, void 0,
      _react.default.createElement(_reactPlayer.default, _extends({
        className: "react-player",
        ref: ref => {this.player = ref;},
        url: config.url },
      dimensions, {
        controls: true }))),


      _jsx("div", {}, void 0,
      this.timeLinks(config.options.timelinks))));



  }}


MarkdownMedia.defaultProps = {
  compact: false };var _default =






MarkdownMedia;exports.default = _default;