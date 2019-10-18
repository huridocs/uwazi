"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.notificationActions = void 0;var _notificationsActions = require("./actions/notificationsActions");
var _Notifications = _interopRequireDefault(require("./components/Notifications"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const notificationActions = {
  notify: _notificationsActions.notify,
  removeNotification: _notificationsActions.removeNotification };exports.notificationActions = notificationActions;var _default =






_Notifications.default;exports.default = _default;