"use strict";var _react = _interopRequireDefault(require("react"));

var _enzyme = require("enzyme");

var _ToggleDisplay = _interopRequireDefault(require("../ToggleDisplay"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

describe('ToggleDisplay', () => {
  it('should not render children by default', () => {
    const component = (0, _enzyme.shallow)(_jsx(_ToggleDisplay.default, {}, void 0, _jsx("span", {}, void 0, "children")));
    expect(component).toMatchSnapshot();
  });

  it('should render labels passed for buttons', () => {
    const component = (0, _enzyme.shallow)(_jsx(_ToggleDisplay.default, { showLabel: "showLabel", hideLabel: "hideLabel" }, void 0, _jsx("span", {}, void 0, "children")));
    expect(component.find('button')).toMatchSnapshot();
    component.setState({ show: true });
    expect(component.find('button')).toMatchSnapshot();
  });

  describe('when passed open true', () => {
    it('should show the children by default', () => {
      const component = (0, _enzyme.shallow)(_jsx(_ToggleDisplay.default, { open: true }, void 0, _jsx("span", {}, void 0, "children")));
      expect(component).toMatchSnapshot();
    });
  });

  describe('on show button click', () => {
    it('should render children passed and hide button', () => {
      const component = (0, _enzyme.shallow)(_jsx(_ToggleDisplay.default, {}, void 0, _jsx("span", {}, void 0, "children")));
      component.find('button').simulate('click');
      expect(component).toMatchSnapshot();
    });
  });

  describe('on hide button click', () => {
    it('should render hide children', () => {
      const component = (0, _enzyme.shallow)(_jsx(_ToggleDisplay.default, {}, void 0, _jsx("span", {}, void 0, "children")));
      component.find('button').simulate('click');
      component.find('button').simulate('click');
      expect(component).toMatchSnapshot();
    });

    it('should call onHide callback prop', () => {
      const onHide = jasmine.createSpy('onHide');
      const component = (0, _enzyme.shallow)(_jsx(_ToggleDisplay.default, { onHide: onHide }, void 0, _jsx("span", {}, void 0, "children")));
      component.find('button').simulate('click');
      component.find('button').simulate('click');
      expect(onHide).toHaveBeenCalled();
    });
  });
});