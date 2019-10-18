"use strict";var _react = _interopRequireDefault(require("react"));
var _immutable = _interopRequireDefault(require("immutable"));
var _enzyme = require("enzyme");

var _NeedAuthorization = require("../NeedAuthorization");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

describe('NeedAuthorization', () => {
  let component;
  let props;

  beforeEach(() => {
    props = { authorized: true };
  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_NeedAuthorization.NeedAuthorization, props, _jsx("div", {})));
  };

  describe('when authorized', () => {
    it('should render children', () => {
      render();
      expect(component.find('div').length).toBe(1);
    });
  });

  describe('when not authorized', () => {
    it('should render children', () => {
      props.authorized = false;
      render();
      expect(component.find('div').length).toBe(0);
    });
  });

  describe('maped state', () => {
    it('should map authorized true if user in the store', () => {
      const store = {
        user: _immutable.default.fromJS({ _id: 1, role: 'admin' }) };

      const state = (0, _NeedAuthorization.mapStateToProps)(store, { roles: ['admin'] });
      expect(state).toEqual({ authorized: true });
    });

    it('should map authorized false if user not in the store', () => {
      const store = {
        user: _immutable.default.fromJS({}) };

      const state = (0, _NeedAuthorization.mapStateToProps)(store, { roles: ['admin'] });
      expect(state).toEqual({ authorized: false });
    });
  });
});