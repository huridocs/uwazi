"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _UsersAPI = _interopRequireDefault(require("../UsersAPI"));
var _UsersList = _interopRequireDefault(require("../components/UsersList"));
var _Users = require("../Users");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

describe('Users', () => {
  let component;
  let context;
  let users;

  beforeEach(() => {
    users = [{ _id: 1, name: 'Batman' }];
    spyOn(_UsersAPI.default, 'get').and.returnValue(Promise.resolve(users));
    context = { store: { getState: () => ({}), dispatch: jasmine.createSpy('dispatch') } };
    component = (0, _enzyme.shallow)(_jsx(_Users.Users, {}), { context });
  });

  describe('requestState', () => {
    it('should get the current user, and metadata', async () => {
      const request = {};
      const actions = await _Users.Users.requestState(request);

      expect(actions).toMatchSnapshot();
      expect(_UsersAPI.default.get).toHaveBeenCalledWith(request);
    });
  });

  describe('render', () => {
    it('should render a UsersList', () => {
      expect(component.find(_UsersList.default).length).toBe(1);
    });
  });
});