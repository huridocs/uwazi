"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapStateToProps = mapStateToProps;exports.default = exports.FiltersFromProperties = void 0;var _reactRedux = require("react-redux");
var _immutable = _interopRequireDefault(require("immutable"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireDefault(require("react"));

var _I18N = require("../../I18N");
var _FormGroup = _interopRequireDefault(require("../../DocumentForm/components/FormGroup"));

var _DateFilter = _interopRequireDefault(require("./DateFilter"));
var _NestedFilter = _interopRequireDefault(require("./NestedFilter"));
var _NumberRangeFilter = _interopRequireDefault(require("./NumberRangeFilter"));
var _SelectFilter = _interopRequireDefault(require("./SelectFilter"));
var _TextFilter = _interopRequireDefault(require("./TextFilter"));
var _RelationshipFilter = _interopRequireDefault(require("./RelationshipFilter"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}function _extends() {_extends = Object.assign || function (target) {for (var i = 1; i < arguments.length; i++) {var source = arguments[i];for (var key in source) {if (Object.prototype.hasOwnProperty.call(source, key)) {target[key] = source[key];}}}return target;};return _extends.apply(this, arguments);}function _objectWithoutProperties(source, excluded) {if (source == null) return {};var target = _objectWithoutPropertiesLoose(source, excluded);var key, i;if (Object.getOwnPropertySymbols) {var sourceSymbolKeys = Object.getOwnPropertySymbols(source);for (i = 0; i < sourceSymbolKeys.length; i++) {key = sourceSymbolKeys[i];if (excluded.indexOf(key) >= 0) continue;if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;target[key] = source[key];}}return target;}function _objectWithoutPropertiesLoose(source, excluded) {if (source == null) return {};var target = {};var sourceKeys = Object.keys(source);var key, i;for (i = 0; i < sourceKeys.length; i++) {key = sourceKeys[i];if (excluded.indexOf(key) >= 0) continue;target[key] = source[key];}return target;}

const translatedOptions = property => property.options.map(option => {
  option.label = (0, _I18N.t)(property.content, option.label, null, false);
  if (option.values) {
    option.options = option.values.map(val => {
      val.label = (0, _I18N.t)(property.content, val.label, null, false);
      return val;
    });
  }
  return option;
});

const FiltersFromProperties = (_ref) => {let { onChange, properties, translationContext, modelPrefix = '' } = _ref,props = _objectWithoutProperties(_ref, ["onChange", "properties", "translationContext", "modelPrefix"]);return (
    _jsx(_react.default.Fragment, {}, void 0,
    properties.map(property => {
      const commonProps = { model: `.filters${modelPrefix}.${property.name}`, label: (0, _I18N.t)(translationContext, property.label), onChange };

      let filter = _react.default.createElement(_TextFilter.default, commonProps);

      if (property.type === 'relationshipfilter') {
        filter = _react.default.createElement(_RelationshipFilter.default, _extends({}, commonProps, { storeKey: props.storeKey, translationContext: translationContext, property: property }));
      }

      if (property.type === 'numeric') {
        filter = _react.default.createElement(_NumberRangeFilter.default, commonProps);
      }

      if (property.type === 'select' || property.type === 'multiselect' || property.type === 'relationship') {
        filter =
        _react.default.createElement(_SelectFilter.default, _extends({},
        commonProps, {
          options: translatedOptions(property),
          prefix: property.name,
          showBoolSwitch: property.type === 'multiselect' || property.type === 'relationship',
          sort: property.type === 'relationship' }));


      }

      if (property.type === 'nested') {
        filter = _react.default.createElement(_NestedFilter.default, _extends({}, commonProps, { property: property, aggregations: props.aggregations }));
      }

      if (property.type === 'date' || property.type === 'multidate' || property.type === 'multidaterange' || property.type === 'daterange') {
        filter = _react.default.createElement(_DateFilter.default, _extends({}, commonProps, { format: props.dateFormat }));
      }

      return _jsx(_FormGroup.default, {}, property.name, filter);
    })));};exports.FiltersFromProperties = FiltersFromProperties;



FiltersFromProperties.defaultProps = {
  onChange: () => {},
  dateFormat: '',
  modelPrefix: '',
  translationContext: '' };












function mapStateToProps(state, props) {
  return {
    dateFormat: state.settings.collection.get('dateFormat'),
    aggregations: state[props.storeKey].aggregations,
    storeKey: props.storeKey };

}var _default =

(0, _reactRedux.connect)(mapStateToProps)(FiltersFromProperties);exports.default = _default;