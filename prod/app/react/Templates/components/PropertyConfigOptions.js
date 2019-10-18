"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _FilterSuggestions = _interopRequireDefault(require("./FilterSuggestions"));

var _PropertyConfigOption = _interopRequireDefault(require("./PropertyConfigOption"));
var _Tip = _interopRequireDefault(require("../../Layout/Tip"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class PropertyConfigOptions extends _react.Component {
  render() {
    const { index, property, type, canBeFilter } = this.props;
    return (
      _jsx("div", {}, void 0,
      _jsx(_PropertyConfigOption.default, { label: "Hide label", model: `template.data.properties[${index}].noLabel` }, void 0,
      _jsx(_Tip.default, {}, void 0, "This property will be shown without the label.")),

      _jsx(_PropertyConfigOption.default, { label: "Required property", model: `template.data.properties[${index}].required` }, void 0,
      _jsx(_Tip.default, {}, void 0, "You won't be able to publish a document if this property is empty.")),

      _jsx(_PropertyConfigOption.default, { label: "Show in cards", model: `template.data.properties[${index}].showInCard` }, void 0,
      _jsx(_Tip.default, {}, void 0, "This property will appear in the library cards as part of the basic info.")),


      canBeFilter &&
      _jsx("div", { className: "inline-group" }, void 0,
      _jsx(_PropertyConfigOption.default, { label: "Use as filter", model: `template.data.properties[${index}].filter` }, void 0,
      _jsx(_Tip.default, {}, void 0, "This property will be used for filtering the library results. When properties match in equal name and field type with other document types, they will be combined for filtering.")),




      property.filter &&
      _jsx(_react.default.Fragment, {}, void 0,
      _jsx(_PropertyConfigOption.default, { label: "Default filter", model: `template.data.properties[${index}].defaultfilter` }, void 0,
      _jsx(_Tip.default, {}, void 0, "Use this property as a default filter in the library. When there are no document types selected, this property will show as a default filter for your collection.")),




      ['text', 'date', 'numeric', 'select'].includes(type) &&
      _jsx(_PropertyConfigOption.default, { label: "Priority sorting", model: `template.data.properties[${index}].prioritySorting` }, void 0,
      _jsx(_Tip.default, {}, void 0, "Properties marked as priority sorting will be used as default sorting criteria. If more than one property is marked as priority sorting the system will try to pick-up the best fit. When listing mixed template types, the system will pick-up the best combined priority sorting."))),









      _react.default.createElement(_FilterSuggestions.default, property))));




  }}


PropertyConfigOptions.defaultProps = {
  canBeFilter: true };var _default =










PropertyConfigOptions;exports.default = _default;