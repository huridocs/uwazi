"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _immutable = _interopRequireDefault(require("immutable"));
var _reactReduxForm = require("react-redux-form");
var _UserForm = _interopRequireDefault(require("../UserForm"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('NewUser', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      submit: jasmine.createSpy('submit').and.returnValue(Promise.resolve()),
      user: _immutable.default.fromJS({ _id: 1, username: 'admin' }) };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_UserForm.default, props));
  };

  describe('render', () => {
    it('should render a form', () => {
      render();
      expect(component.find(_reactReduxForm.LocalForm).length).toBe(1);
    });
  });

  describe('submit', () => {
    it('should call submit', () => {
      render();
      const instance = component.instance();
      const user = { username: 'spidey', email: 'peter@parker.com' };
      instance.submit(user);
      expect(props.submit).toHaveBeenCalledWith(user);
    });
  });
});