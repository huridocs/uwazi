"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");

var _NumericRangeSlide = _interopRequireDefault(require("../NumericRangeSlide"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

describe('NumericRangeSlide', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      onChange: jasmine.createSpy('onChange'),
      value: 0.5,
      min: 0,
      max: 1,
      step: 0.1,
      minLabel: 'Min',
      maxLabel: 'Max' };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_NumericRangeSlide.default, props));
  };

  it('should render range input component', () => {
    render();
    expect(component).toMatchSnapshot();
  });

  it('should trigger onChange events', () => {
    render();
    component.find('input').first().simulate('change', { target: { value: '0.6' } });
    expect(props.onChange).toHaveBeenCalledWith(0.6);
  });

  it('should accept components as min and max labels', () => {
    props.minLabel = _jsx("b", {}, void 0, "Min");
    props.maxLabel = _jsx("b", {}, void 0, "Max");
    render();
    expect(component).toMatchSnapshot();
  });
});