"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _I18N = require("../../I18N");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class SearchTips extends _react.Component {
  constructor(props) {
    super(props);
    this.showSearchTips = this.showSearchTips.bind(this);
  }

  showSearchTips() {
    const searchTipsText =
    _jsx("ul", {}, void 0,
    _jsx("li", {}, void 0,
    (0, _I18N.t)('System',
    'Search Tips: wildcard',
    'Use an * for wildcard search. Ie: "juris*" will match words  ' +
    'such as jurisdiction, jurisdictional, jurists, jurisprudence, etc.',
    false)),

    _jsx("li", {}, void 0,
    (0, _I18N.t)('System',
    'Search Tips: one char wildcard',
    '? for one character wildcard. Ie: "198?" will match 1980 to 1989 and also 198a, 198b, etc.',
    false)),

    _jsx("li", {}, void 0,
    (0, _I18N.t)('System',
    'Search Tips: exact term',
    'Exact term match by enclosing your search string with quotes. Ie. "Costa Rica"' +
    ' will toss different results compared to Costa Rica without quotes.',
    false)),

    _jsx("li", {}, void 0,
    (0, _I18N.t)('System',
    'Search Tips: proximity',
    '~ for proximity searches. Ie: "the status"~5 will find anything having "the" and' +
    '"status" within a distance of 5 words, such as "the procedural status", "the specific legal status".',
    false)),

    _jsx("li", {}, void 0,
    (0, _I18N.t)('System',
    'Search Tips: boolean',
    'AND, OR and NOT for boolean searches. Ie. "status AND women NOT Nicaragua" will match anything ' +
    'containing both the words status and women, and necessarily not containing the word Nicaragua.',
    false)));




    this.context.confirm({
      accept: () => {},
      type: 'info',
      title: (0, _I18N.t)('System', 'Narrow down your searches', null, false),
      message: searchTipsText,
      noCancel: true });

  }

  render() {
    return (
      _jsx("div", {
        className: "search-tips",
        onClick: this.showSearchTips }, void 0,

      (0, _I18N.t)('System', 'Search tips', null, false)));


  }}exports.default = SearchTips;


SearchTips.contextTypes = {
  confirm: _propTypes.default.func };