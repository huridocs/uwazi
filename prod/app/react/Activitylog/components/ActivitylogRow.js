"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _react = _interopRequireWildcard(require("react"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _moment = _interopRequireDefault(require("moment"));
var _immutable = require("immutable");
var _DescriptionWrapper = _interopRequireDefault(require("./DescriptionWrapper"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

const label = method => {
  switch (method) {
    case 'CREATE':
      return _jsx("span", { className: "badge btn-color-9" }, void 0, method);
    case 'UPDATE':
      return _jsx("span", { className: "badge btn-color-6" }, void 0, method);
    case 'DELETE':
      return _jsx("span", { className: "badge btn-color-2" }, void 0, method);
    case 'RAW':
      return _jsx("span", { className: "badge btn-color-17" }, void 0, method);
    default:
      return _jsx("span", { className: "badge btn-color-17" }, void 0, method);}

};

class ActivitylogRow extends _react.Component {
  constructor(props) {
    super(props);
    this.state = { expanded: false };
    this.toggleExpand = this.toggleExpand.bind(this);
  }

  toggleExpand() {
    const { expanded } = this.state;
    this.setState({ expanded: !expanded });
  }

  render() {
    const { entry } = this.props;
    const { expanded } = this.state;

    const time = `${(0, _moment.default)(entry.get('time')).format('L')} ${(0, _moment.default)(entry.get('time')).locale('en').format('LTS')}`;
    const semanticData = entry.get('semantic').toJS();

    let description =
    _jsx(_DescriptionWrapper.default, { entry: entry, toggleExpand: this.toggleExpand, expanded: expanded }, void 0,
    _jsx("span", { className: "activitylog-extra" }, void 0, entry.get('method'), " : ", entry.get('url')));



    if (semanticData.beautified) {
      description =
      _jsx(_DescriptionWrapper.default, { entry: entry, toggleExpand: this.toggleExpand, expanded: expanded }, void 0,
      _jsx("span", {}, void 0,
      _jsx("span", { className: "activitylog-prefix" }, void 0, semanticData.description),
      _jsx("span", { className: "activitylog-name" }, void 0, " ", semanticData.name),
      _jsx("span", { className: "activitylog-extra" }, void 0, " ", semanticData.extra)));



    }

    return (
      _jsx("tr", { className: semanticData.beautified ? 'activitylog-beautified' : 'activitylog-raw' }, entry.get('_id'),
      _jsx("td", {}, void 0, semanticData.beautified ? label(semanticData.action) : label('RAW')),
      _jsx("td", {}, void 0, entry.get('username') || '-'),
      _jsx("td", {}, void 0, description),
      _jsx("td", { className: "activitylog-time" }, void 0, time)));


  }}


ActivitylogRow.defaultProps = {
  entry: (0, _immutable.Map)() };var _default =






ActivitylogRow;exports.default = _default;