"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _Notifications = require("../../Notifications");
var _I18N = require("../../I18N");
var _RequestParams = require("../../utils/RequestParams");
var _SettingsAPI = _interopRequireDefault(require("../SettingsAPI"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const saveSettings = data => dispatch => _SettingsAPI.default.save(new _RequestParams.RequestParams(data)).
then(() => {
  dispatch(_Notifications.notificationActions.notify((0, _I18N.t)('System', 'Settings updated'), 'success'));
});var _default =

saveSettings;exports.default = _default;