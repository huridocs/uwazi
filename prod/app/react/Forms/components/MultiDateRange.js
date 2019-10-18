"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _UI = require("../../UI");
var _DatePicker = _interopRequireDefault(require("./DatePicker"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class MultiDateRange extends _react.Component {
  constructor(props) {
    super(props);
    const values = this.props.value && this.props.value.length ? this.props.value : [{ from: null, to: null }];
    this.state = { values };
  }

  fromChange(index, value) {
    const values = this.state.values.slice();
    values[index] = Object.assign({}, values[index]);
    values[index].from = value;
    this.setState({ values });
    this.props.onChange(values);
  }

  toChange(index, value) {
    const values = this.state.values.slice();
    values[index] = Object.assign({}, values[index]);
    values[index].to = value;
    this.setState({ values });
    this.props.onChange(values);
  }

  add(e) {
    e.preventDefault();
    const values = this.state.values.slice();
    values.push({ from: null, to: null });
    this.setState({ values });
  }

  remove(index, e) {
    e.preventDefault();
    const values = this.state.values.slice();
    values.splice(index, 1);
    this.setState({ values });
    this.props.onChange(values);
  }

  render() {
    return (
      _jsx("div", { className: "multidate" }, void 0,
      (() => this.state.values.map((value, index) =>
      _jsx("div", { className: "multidate-item" }, index,
      _jsx("div", { className: "multidate-range" }, void 0,
      _jsx("div", { className: "DatePicker__From" }, void 0,
      _jsx("span", {}, void 0, "From:\xA0"),
      _jsx(_DatePicker.default, { format: this.props.format, value: value.from, onChange: this.fromChange.bind(this, index) })),

      _jsx("div", { className: "DatePicker__To" }, void 0,
      _jsx("span", {}, void 0, "\xA0To:\xA0"),
      _jsx(_DatePicker.default, { format: this.props.format, value: value.to, endOfDay: true, onChange: this.toChange.bind(this, index) })),

      _jsx("button", { className: "react-datepicker__delete-icon", onClick: this.remove.bind(this, index) })))))(),



      _jsx("button", { className: "btn btn-success add", onClick: this.add.bind(this) }, void 0,
      _jsx(_UI.Icon, { icon: "plus" }), "\xA0",
      _jsx("span", {}, void 0, "Add date"))));



  }}exports.default = MultiDateRange;