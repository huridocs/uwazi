"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireDefault(require("react"));

var _I18N = require("../../I18N");
var _Markdown = _interopRequireDefault(require("../../Markdown"));
var _Layout = require("../../Layout");

var _GeolocationViewer = _interopRequireDefault(require("./GeolocationViewer"));
var _ValueList = _interopRequireDefault(require("./ValueList"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

const showByType = (prop, compact) => {
  let result = prop.value;
  switch (prop.type) {
    case null:
      result = (0, _I18N.t)('System', 'No property');
      break;
    case 'markdown':
      result = _jsx(_Markdown.default, { markdown: prop.value });
      break;
    case 'image':
      result = _jsx("img", { className: `multimedia-img ${prop.style}`, src: prop.value, alt: prop.label }, prop.value);
      break;
    case 'media':
      result = _jsx(_Markdown.default, { markdown: `{media}(${prop.value})`, compact: true });
      break;
    case 'geolocation':
      result = _jsx(_GeolocationViewer.default, { points: prop.value, onlyForCards: Boolean(prop.onlyForCards) });
      break;
    default:
      if (prop.url) {
        result = _jsx(_I18N.I18NLink, { to: prop.url }, prop.url, prop.icon && _jsx(_Layout.Icon, { className: "item-icon", data: prop.icon }), prop.value);
      }

      if (prop.value && prop.value.map) {
        prop.value = prop.value.map(_value => {
          const value = showByType(_value, compact);
          return value && value.value ? value : { value };
        });
        result = _jsx(_ValueList.default, { compact: compact, property: prop });
      }
      break;}


  return result;
};

const removeEmptyValues = p => {
  if (Array.isArray(p.value)) {
    return p.value.length;
  }
  return p.value || p.type === null;
};

const Metadata = ({ metadata, compact, renderLabel }) =>
_jsx(_react.default.Fragment, {}, void 0,
metadata.filter(removeEmptyValues).map((prop, index) => {
  let type = prop.type ? prop.type : 'default';
  type = type === 'image' || type === 'media' ? 'multimedia' : type;
  return (
    _jsx("dl", { className: `metadata-type-${type} ${prop.fullWidth ? 'full-width' : ''}` }, `${prop.name}_${index}`,
    renderLabel(prop, _jsx("dt", {}, void 0, (0, _I18N.t)(prop.translateContext, prop.label))),
    _jsx("dd", { className: prop.sortedBy ? 'item-current-sort' : '' }, void 0,
    showByType(prop, compact))));



}));



Metadata.defaultProps = {
  compact: false,
  renderLabel: (prop, label) => label };var _default =




















Metadata;exports.default = _default;