"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _serializeJavascript = _interopRequireDefault(require("serialize-javascript"));

var _languagesList = require("../../shared/languagesList");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

const determineHotAssets = query => ({
  JS: [
  'http://localhost:8080/pdfjs-dist.js',
  'http://localhost:8080/nprogress.js',
  'http://localhost:8080/main.js',
  'http://localhost:8080/vendor.js'],

  CSS: [
  `http://localhost:8080/CSS/vendor.css${query}`,
  `http://localhost:8080/CSS/main.css${query}`,
  'http://localhost:8080/pdfjs-dist.css'] });



const determineAssets = (assets, languageData) => ({
  JS: [
  assets['pdfjs-dist'].js,
  assets.nprogress.js,
  assets.vendor.js,
  assets.main.js],

  CSS: [
  assets.vendor.css[languageData.rtl ? 1 : 0],
  assets.main.css[languageData.rtl ? 1 : 0],
  assets['pdfjs-dist'].css[0]] });



const googelFonts =
_jsx("link", {
  rel: "stylesheet",
  href: "https://fonts.googleapis.com/css?family=Roboto+Mono:100,300,400,500,700|Roboto+Slab:100,300,400,700|Roboto:100,300,400,500,700,900" });



const headTag = (head, CSS, reduxData) =>
_jsx("head", {}, void 0,
head.title.toComponent(),
head.meta.toComponent(),
head.link.toComponent(),
_jsx("meta", { name: "viewport", content: "width=device-width, initial-scale=1.0" }),
CSS.map((style, key) => _jsx("link", { href: style, rel: "stylesheet", type: "text/css" }, key)),
_jsx("style", { type: "text/css", dangerouslySetInnerHTML: { __html: reduxData.settings.collection.get('customCSS') } }),
googelFonts,
_jsx("link", { rel: "shortcut icon", href: "/public/favicon.ico" }));



class Root extends _react.Component {
  renderInitialData() {
    let innerHtml = '';
    if (this.props.reduxData) {
      innerHtml += `window.__reduxData__ = ${(0, _serializeJavascript.default)(this.props.reduxData, { isJSON: true })};`;
    }

    if (this.props.user) {
      innerHtml += `window.__user__ = ${(0, _serializeJavascript.default)(this.props.user, { isJSON: true })};`;
    }

    return (
      _jsx("script", { dangerouslySetInnerHTML: { __html: innerHtml } }) //eslint-disable-line
    );
  }

  render() {
    const isHotReload = process.env.HOT;
    const { head, language, assets, reduxData, content } = this.props;

    const languageData = _languagesList.allLanguages.find(l => l.key === language);
    const query = languageData && languageData.rtl ? '?rtl=true' : '';

    const { JS, CSS } = isHotReload ? determineHotAssets(query) : determineAssets(assets, languageData);

    return (
      _jsx("html", { lang: language }, void 0,
      headTag(head, CSS, reduxData),
      _jsx("body", {}, void 0,
      _jsx("div", { id: "root", dangerouslySetInnerHTML: { __html: content } }),
      this.renderInitialData(),
      head.script.toComponent(),
      JS.map((file, index) => _jsx("script", { src: file }, index)))));



  }}var _default =












Root;exports.default = _default;