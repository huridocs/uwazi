"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.IconSelector = exports.ListItem = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));

var _library = require("../../UI/Icon/library");
var _UI = require("../../UI");
var _worldCountries = _interopRequireDefault(require("world-countries"));
var _reactFlags = _interopRequireDefault(require("react-flags"));

var _DropdownList = _interopRequireDefault(require("./DropdownList"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _extends() {_extends = Object.assign || function (target) {for (var i = 1; i < arguments.length; i++) {var source = arguments[i];for (var key in source) {if (Object.prototype.hasOwnProperty.call(source, key)) {target[key] = source[key];}}}return target;};return _extends.apply(this, arguments);}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

const style = { display: 'inline-block', width: '25px' };

class ListItem extends _react.Component {
  shouldComponentUpdate(nextProps) {
    return this.props.item._id !== nextProps.item._id;
  }

  render() {
    const { item } = this.props;
    let icon = _jsx("span", {}, void 0, "No icon / flag");
    if (item.type === 'Icons') {
      icon =
      _jsx("span", { style: style }, void 0,
      _jsx(_UI.Icon, { icon: `${item._id}` }));


    }

    if (item.type === 'Flags') {
      icon =
      _jsx("span", { style: style }, void 0,
      _jsx(_reactFlags.default, {
        name: item._id,
        format: "png",
        pngSize: 16,
        shiny: true,
        alt: `${item.label} flag`,
        basePath: "/flag-images" }));



    }

    return (
      _jsx("span", {}, void 0,
      icon,
      item.label));


  }}exports.ListItem = ListItem;


class IconSelector extends _react.Component {
  componentWillMount() {
    const listOptions = [{ _id: null, type: 'Empty' }].
    concat(_library.iconNames.map(icon => ({
      _id: icon,
      type: 'Icons',
      label: icon }))).
    concat(_worldCountries.default.map(country => ({
      _id: country.cca3,
      type: 'Flags',
      label: country.name.common })));


    this.setState({ listOptions });
  }

  render() {
    return (
      _react.default.createElement(_DropdownList.default, _extends({
        valueField: "_id",
        textField: "label",
        data: this.state.listOptions,
        valueComponent: ListItem,
        itemComponent: ListItem,
        defaultValue: this.state.listOptions[0],
        filter: "contains",
        groupBy: "type" },
      this.props)));


  }}exports.IconSelector = IconSelector;var _default =






IconSelector;exports.default = _default;