"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _immutable = _interopRequireDefault(require("immutable"));
var _EditUser = require("../EditUser");
var _UserForm = _interopRequireDefault(require("../UserForm"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('EditUser', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      user: _immutable.default.fromJS({}),
      saveUser: jasmine.createSpy('saveUser').and.returnValue(Promise.resolve()) };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_EditUser.EditUser, props));
  };

  describe('render', () => {
    it('should render a UserForm and pass saveUser and the user', () => {
      render();
      expect(component.find(_UserForm.default).length).toBe(1);
      expect(component.find(_UserForm.default).props().submit).toBe(props.saveUser);
      expect(component.find(_UserForm.default).props().user).toBe(props.user);
    });
  });

  describe('mapStateToProps', () => {
    it('should find the correct user', () => {
      const _props = { params: { userId: 1 } };
      const state = {
        users: [_immutable.default.fromJS({ _id: 1, name: 'Batman' }), _immutable.default.fromJS({ _id: 2, name: 'Joker' })] };

      const mappedProps = (0, _EditUser.mapStateToProps)(state, _props);
      expect(mappedProps.user.get('name')).toBe('Batman');
    });
  });
});