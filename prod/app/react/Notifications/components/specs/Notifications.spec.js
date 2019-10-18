"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");

var _Notifications = require("../Notifications");
var _Notification = _interopRequireDefault(require("../Notification"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('Notifications', () => {
  let component;
  let props;

  beforeEach(() => {
    props = { notifications: [{ message: '1', type: '1', id: 1 }, { message: '2', type: '2', id: 2 }] };
    component = (0, _enzyme.shallow)(_react.default.createElement(_Notifications.Notifications, props));
  });

  it('should render all notifications passed', () => {
    const notifications = component.find(_Notification.default);

    expect(notifications.first().props()).toEqual({ message: '1', type: '1', id: 1 });
    expect(notifications.last().props()).toEqual({ message: '2', type: '2', id: 2 });
  });
});