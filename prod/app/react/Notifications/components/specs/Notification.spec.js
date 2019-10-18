"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _UI = require("../../../UI");

var _Notification = require("../Notification");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('Notification', () => {
  let component;
  let props;
  const removeNotification = jasmine.createSpy('removeNotification');

  const render = type => {
    props = { message: 'message', id: 'id', removeNotification };
    if (type) {
      props.type = type;
    }
    component = (0, _enzyme.shallow)(_react.default.createElement(_Notification.Notification, props));
  };

  it('should render message passed', () => {
    render();
    expect(component.text()).toContain('message');
  });

  describe('when not passing type', () => {
    it('should have a info icon and info alert', () => {
      render();
      expect(component.find(_UI.Icon).at(0).props().icon).toBe('check');
      expect(component.find('.alert-success').length).toBe(1);
    });
  });

  describe('when passing warning type', () => {
    it('should have a exclamation icon and warning alert', () => {
      render('warning');
      expect(component.find(_UI.Icon).at(0).props().icon).toBe('exclamation-triangle');
      expect(component.find('.alert-warning').length).toBe(1);
    });
  });

  describe('when passing danger type', () => {
    it('should have a exclamation icon and danger alert', () => {
      render('danger');
      expect(component.find(_UI.Icon).at(0).props().icon).toBe('exclamation-triangle');
      expect(component.find('.alert-danger').length).toBe(1);
    });
  });
});