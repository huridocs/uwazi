"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.ThesauriFormGroup = void 0;var _react = _interopRequireWildcard(require("react"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _reactReduxForm = require("react-redux-form");
var _DragAndDrop = require("../../Layout/DragAndDrop");
var _UI = require("../../UI");

var _FormGroup = _interopRequireDefault(require("../../DocumentForm/components/FormGroup"));

var _ThesauriFormField = _interopRequireDefault(require("./ThesauriFormField"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}function _extends() {_extends = Object.assign || function (target) {for (var i = 1; i < arguments.length; i++) {var source = arguments[i];for (var key in source) {if (Object.prototype.hasOwnProperty.call(source, key)) {target[key] = source[key];}}}return target;};return _extends.apply(this, arguments);}

class ThesauriFormGroup extends _react.Component {
  constructor(props) {
    super(props);
    this.focus = () => {this.groupInput.focus();};
    this.renderItem = this.renderItem.bind(this);
    this.onChange = this.onChange.bind(this);
    this.removeGroup = this.removeGroup.bind(this);
  }

  onChange(values) {
    const { index, onChange: onGroupChanged } = this.props;
    onGroupChanged(values, index);
  }

  removeGroup() {
    const { index, removeValue } = this.props;
    removeValue(index);
  }

  renderItem(item, index) {
    const { index: groupIndex } = this.props;
    return (
      _react.default.createElement(_ThesauriFormField.default, _extends({}, this.props, { value: item, index: index, groupIndex: groupIndex })));

  }

  render() {
    const { value, index: groupIndex } = this.props;
    return (
      _jsx("div", { className: "group" }, `group-${groupIndex}`,
      _jsx(_FormGroup.default, {}, void 0,
      _jsx(_reactReduxForm.Field, { model: `thesauri.data.values[${groupIndex}].label` }, void 0,
      _react.default.createElement("input", { ref: i => {this.groupInput = i;}, className: "form-control", type: "text", placeholder: "Group name" }),
      _jsx("button", {
        tabIndex: groupIndex + 500,
        type: "button",
        className: "btn btn-xs btn-danger",
        onClick: this.removeGroup }, void 0,

      _jsx(_UI.Icon, { icon: "trash-alt" }), " Delete Group"))),



      _jsx(_DragAndDrop.DragAndDropContainer, {
        items: value.values,
        iconHandle: true,
        renderItem: this.renderItem,
        onChange: this.onChange })));



  }}exports.ThesauriFormGroup = ThesauriFormGroup;var _default =













ThesauriFormGroup;exports.default = _default;