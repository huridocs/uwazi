"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.trackPage = trackPage;exports.mapStateToProps = mapStateToProps;exports.default = exports.GoogleAnalytics = void 0;var _reactRedux = require("react-redux");
var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));

var _utils = require("../utils");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

function trackPage() {
  if (_utils.isClient && window.gtag) {
    window.gtag('send', 'pageview');
  }

  if (_utils.isClient && window._paq) {
    window._paq.push(['setCustomUrl', window.location.href]);
    window._paq.push(['deleteCustomVariables', 'page']);
    window._paq.push(['setGenerationTimeMs', 0]);
    window._paq.push(['trackPageView']);
  }
}

class GoogleAnalytics extends _react.Component {
  constructor(props) {
    super(props);
    if (!props.analyticsTrackingId || !_utils.isClient) {
      return;
    }
    /*eslint-disable */
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', props.analyticsTrackingId);
    trackPage();
    /*eslint-enable */
  }

  render() {
    if (!this.props.analyticsTrackingId) {
      return false;
    }
    return _jsx("script", { async: true, src: `https://www.googletagmanager.com/gtag/js?id=${this.props.analyticsTrackingId}` });
  }}exports.GoogleAnalytics = GoogleAnalytics;


GoogleAnalytics.defaultProps = {
  analyticsTrackingId: '' };






function mapStateToProps({ settings }) {
  return {
    analyticsTrackingId: settings.collection.get('analyticsTrackingId') };

}var _default =

(0, _reactRedux.connect)(mapStateToProps)(GoogleAnalytics);exports.default = _default;