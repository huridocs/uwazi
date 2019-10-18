"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");

var _reactReduxForm = require("react-redux-form");
var _FormGroup = _interopRequireDefault(require("../FormGroup"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

describe('FormGroup', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {};
  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_FormGroup.default, props, _jsx("label", {}, void 0, "label"), _jsx(_reactReduxForm.Field, {}, void 0, _jsx("input", {}))));
  };

  it('should render the children', () => {
    render();
    const label = component.find('label');
    expect(label.length).toBe(1);
    const field = component.find(_reactReduxForm.Field);
    expect(field.length).toBe(1);
  });

  it('should render errors when touched and invalid', () => {
    props.touched = true;
    props.valid = false;
    render();
    const group = component.find('.form-group');
    expect(group.hasClass('has-error')).toBe(true);
  });

  it('should render errors when touched and submitFailed', () => {
    props.touched = false;
    props.submitFailed = true;
    props.valid = false;
    render();
    const group = component.find('.form-group');
    expect(group.hasClass('has-error')).toBe(true);
  });

  it('should not render errors when submitFailed with no errors', () => {
    props.submitFailed = true;
    render();
    const group = component.find('.form-group');
    expect(group.hasClass('has-error')).toBe(false);
  });
});