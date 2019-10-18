"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");

var _reactReduxForm = require("react-redux-form");
var _FormGroup = require("../FormGroup");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

describe('FormGroup', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      model: 'username' };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_FormGroup.FormGroup, props, _jsx("label", {}, void 0, "label"), _jsx(_reactReduxForm.Field, {}, void 0, _jsx("input", {}))));
  };

  it('should render render children', () => {
    props.hasError = true;
    render();
    const control = component.find(_reactReduxForm.Control.custom);
    expect(control.props().model).toBe(props.model);
  });

  describe('mapProps className', () => {
    let mapProps;
    beforeEach(() => {
      render();
      const control = component.find(_reactReduxForm.Control.custom);
      mapProps = control.props().mapProps;
    });

    it('should be has-error class when pristine but submitFailed and invalid', () => {
      let ownProps = { fieldValue: { valid: false, submitFailed: true } };
      expect(mapProps.className(ownProps)).toBe('has-error');

      ownProps = { fieldValue: { $form: { valid: false, submitFailed: true } } };
      expect(mapProps.className(ownProps)).toBe('has-error');
    });

    it('should be an empty string when valid', () => {
      let ownProps = { fieldValue: { valid: true } };
      expect(mapProps.className(ownProps)).toBe('');

      ownProps = { fieldValue: { $form: { valid: true } } };
      expect(mapProps.className(ownProps)).toBe('');
    });

    it('should be an empty string when invalid but pristine', () => {
      const ownProps = { fieldValue: { valid: false, pristine: true, submitFailed: false } };
      expect(mapProps.className(ownProps)).toBe('');
    });
  });
});