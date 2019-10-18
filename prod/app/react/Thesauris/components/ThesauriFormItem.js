"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.ThesauriFormItem = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));

var _ThesauriFormField = _interopRequireDefault(require("./ThesauriFormField"));
var _ThesauriFormGroup = _interopRequireDefault(require("./ThesauriFormGroup"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _extends() {_extends = Object.assign || function (target) {for (var i = 1; i < arguments.length; i++) {var source = arguments[i];for (var key in source) {if (Object.prototype.hasOwnProperty.call(source, key)) {target[key] = source[key];}}}return target;};return _extends.apply(this, arguments);}

class ThesauriFormItem extends _react.Component {
  constructor(props) {
    super(props);
    this.focus = () => this.groupItem && this.groupItem.focus();
  }

  render() {
    const { value } = this.props;
    if (value.values) {
      return _react.default.createElement(_ThesauriFormGroup.default, _extends({ ref: f => {this.groupItem = f;} }, this.props));
    }
    return _react.default.createElement(_ThesauriFormField.default, this.props);
  }}exports.ThesauriFormItem = ThesauriFormItem;var _default =











ThesauriFormItem;exports.default = _default;