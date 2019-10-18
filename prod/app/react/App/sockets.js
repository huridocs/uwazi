"use strict";var _BasicReducer = require("../BasicReducer");
var _I18N = require("../I18N");
var _Notifications = require("../Notifications");
var _store = require("../store");
var _socket = _interopRequireDefault(require("../socket"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

let disconnectNotifyId;
let disconnectTimeoutMessage;
_socket.default.on('disconnect', reason => {
  if (reason === 'transport close') {
    if (disconnectNotifyId) {
      _store.store.dispatch(_Notifications.notificationActions.removeNotification(disconnectNotifyId));
    }
    disconnectTimeoutMessage = setTimeout(() => {
      disconnectNotifyId = _store.store.dispatch(_Notifications.notificationActions.notify('Lost connection to the server, your changes may be lost', 'danger', false));
    }, 8000);
  }
});

_socket.default.on('reconnect', () => {
  clearTimeout(disconnectTimeoutMessage);
  if (disconnectNotifyId) {
    _store.store.dispatch(_Notifications.notificationActions.removeNotification(disconnectNotifyId));
    disconnectNotifyId = _store.store.dispatch(_Notifications.notificationActions.notify('Connected to server', 'success'));
    disconnectNotifyId = null;
  }
});

_socket.default.on('templateChange', template => {
  _store.store.dispatch(_BasicReducer.actions.update('templates', template));
});
_socket.default.on('templateDelete', template => {
  _store.store.dispatch(_BasicReducer.actions.remove('templates', { _id: template.id }));
});

_socket.default.on('updateSettings', settings => {
  _store.store.dispatch(_BasicReducer.actions.set('settings/collection', settings));
});

_socket.default.on('thesauriChange', thesauri => {
  _store.store.dispatch(_BasicReducer.actions.update('thesauris', thesauri));
});
_socket.default.on('thesauriDelete', thesauri => {
  _store.store.dispatch(_BasicReducer.actions.remove('thesauris', { _id: thesauri.id }));
});

_socket.default.on('translationsChange', translations => {
  _store.store.dispatch(_BasicReducer.actions.update('translations', translations));
  _I18N.t.resetCachedTranslation();
  _I18N.Translate.resetCachedTranslation();
});

_socket.default.on('IMPORT_CSV_START', () => _store.store.dispatch(_BasicReducer.actions.set('importStart', true)));
_socket.default.on('IMPORT_CSV_PROGRESS', progress => _store.store.dispatch(_BasicReducer.actions.set('importProgress', progress)));
_socket.default.on('IMPORT_CSV_ERROR', error => _store.store.dispatch(_BasicReducer.actions.set('importError', error)));
_socket.default.on('IMPORT_CSV_END', () => _store.store.dispatch(_BasicReducer.actions.set('importEnd', true)));