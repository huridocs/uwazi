"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _NewUser = require("../NewUser");
var _UserForm = _interopRequireDefault(require("../UserForm"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('NewUser', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      newUser: jasmine.createSpy('newUser').and.returnValue(Promise.resolve()) };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_NewUser.NewUser, props));
  };

  describe('render', () => {
    it('should render a form with the proper submit function', () => {
      render();
      expect(component.find(_UserForm.default).length).toBe(1);
      expect(component.find(_UserForm.default).props().submit).toBe(props.newUser);
    });
  });
});