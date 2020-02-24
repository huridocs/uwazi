import { actions } from 'app/BasicReducer';
import { t, Translate } from 'app/I18N';
import { notificationActions } from 'app/Notifications';
import { store } from '../store';
import socket from '../socket';

let disconnectNotifyId;
let disconnectTimeoutMessage;
socket.on('disconnect', reason => {
  if (reason === 'transport close') {
    if (disconnectNotifyId) {
      store.dispatch(notificationActions.removeNotification(disconnectNotifyId));
    }
    disconnectTimeoutMessage = setTimeout(() => {
      disconnectNotifyId = store.dispatch(
        notificationActions.notify(
          'Lost connection to the server, your changes may be lost',
          'danger',
          false
        )
      );
    }, 8000);
  }
});

socket.on('reconnect', () => {
  clearTimeout(disconnectTimeoutMessage);
  if (disconnectNotifyId) {
    store.dispatch(notificationActions.removeNotification(disconnectNotifyId));
    disconnectNotifyId = store.dispatch(
      notificationActions.notify('Connected to server', 'success')
    );
    disconnectNotifyId = null;
  }
});

socket.on('templateChange', template => {
  store.dispatch(actions.update('templates', template));
});
socket.on('templateDelete', template => {
  store.dispatch(actions.remove('templates', { _id: template.id }));
});

socket.on('updateSettings', settings => {
  store.dispatch(actions.set('settings/collection', settings));
});

socket.on('thesauriChange', thesauri => {
  store.dispatch(actions.update('thesauris', thesauri));
});
socket.on('thesauriDelete', thesauri => {
  store.dispatch(actions.remove('thesauris', { _id: thesauri.id }));
});

socket.on('translationsChange', translations => {
  store.dispatch(actions.update('translations', translations));
  t.resetCachedTranslation();
  Translate.resetCachedTranslation();
});

socket.on('IMPORT_CSV_START', () => store.dispatch(actions.set('importStart', true)));
socket.on('IMPORT_CSV_PROGRESS', progress =>
  store.dispatch(actions.set('importProgress', progress))
);
socket.on('IMPORT_CSV_ERROR', error => store.dispatch(actions.set('importError', error)));
socket.on('IMPORT_CSV_END', () => store.dispatch(actions.set('importEnd', true)));
