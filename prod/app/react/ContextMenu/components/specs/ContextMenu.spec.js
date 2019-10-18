"use strict";var _react = _interopRequireWildcard(require("react"));
var _enzyme = require("enzyme");
var _reactRedux = require("react-redux");

var _ContextMenu = require("../ContextMenu");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

const SubMenu = () => _jsx("div", {});

class SubMenu2 extends _react.Component {
  render() {
    return _jsx("div", {});
  }}


const SubMenu2Container = (0, _reactRedux.connect)()(SubMenu2);

describe('ContextMenu', () => {
  let component;

  const render = (withProps = {}) => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_ContextMenu.ContextMenu, withProps, _jsx(SubMenu, {}), _jsx(SubMenu2Container, {})));
  };

  describe('on mouseEnter', () => {
    it('should openMenu()', () => {
      const props = { openMenu: jasmine.createSpy('openMenu') };
      render(props);

      component.find('div').simulate('mouseenter');
      expect(props.openMenu).toHaveBeenCalled();
    });
  });

  describe('on mouseleave', () => {
    it('should closeMenu()', () => {
      const props = { closeMenu: jasmine.createSpy('closeMenu') };
      render(props);

      component.find('div').simulate('mouseleave');
      expect(props.closeMenu).toHaveBeenCalled();
    });
  });

  describe('on click', () => {
    it('should closeMenu()', () => {
      const props = { closeMenu: jasmine.createSpy('closeMenu') };
      render(props);

      component.find('div').simulate('click');
      expect(props.closeMenu).toHaveBeenCalled();
    });
  });

  describe('Menu rendered', () => {
    describe('when type is null', () => {
      it('should not render any menu', () => {
        const props = { type: null };
        render(props);

        expect(component.find('div').children().length).toBe(0);
      });
    });

    describe('when type is SubMenu and is open', () => {
      it('should render this menu with active true', () => {
        const props = { type: 'SubMenu', open: true };
        render(props);

        expect(component.find(SubMenu).length).toBe(1);
        expect(component.find(SubMenu).props().active).toBe(true);
      });
    });

    describe('when type is SubMenu2', () => {
      it('should render SubMenu2Container', () => {
        const props = { type: 'SubMenu2', open: false };
        render(props);

        expect(component.find(SubMenu2Container).length).toBe(1);
        expect(component.find(SubMenu2Container).props().active).toBe(false);
      });
    });
  });
});