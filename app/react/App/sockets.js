import { actions } from 'app/BasicReducer';
import { t, Translate } from 'app/I18N';
import { notificationActions } from 'app/Notifications';
import { documentProcessed } from 'app/Uploads/actions/uploadsActions';
import { store } from '../store';
import { socket, reconnectSocket } from '../socket';

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
          t('System', 'Lost connection to the server. Your changes may be lost', null, false),
          'danger',
          false
        )
      );
    }, 8000);
  }
});

socket.io.on('reconnect', () => {
  clearTimeout(disconnectTimeoutMessage);
  if (disconnectNotifyId) {
    store.dispatch(notificationActions.removeNotification(disconnectNotifyId));
    disconnectNotifyId = store.dispatch(
      notificationActions.notify(t('System', 'Connected to server', null, false), 'success')
    );
    disconnectNotifyId = null;
  }
});

socket.on('forceReconnect', () => {
  reconnectSocket();
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
  store.dispatch(actions.update('translations', translations, 'locale'));
  t.resetCachedTranslation();
  // Translate.resetCachedTranslation();
});

socket.on('translationsInstallDone', () => {
  store.dispatch(
    notificationActions.notify(
      t('System', 'Languages installed successfully', null, false),
      'success'
    )
  );
});

socket.on('translationsInstallError', errorMessage => {
  store.dispatch(
    notificationActions.notify(
      `${t(
        'System',
        'An error has occured while installing languages:',
        null,
        false
      )}\n${errorMessage}`,
      'danger'
    )
  );
});

socket.on('translationsDelete', locale => {
  store.dispatch(actions.remove('translations', { locale }, 'locale'));
  t.resetCachedTranslation();
  // Translate.resetCachedTranslation();
});

socket.on('translationsDeleteDone', () => {
  store.dispatch(
    notificationActions.notify(
      t('System', 'Language uninstalled successfully', null, false),
      'success'
    )
  );
});

socket.on('translationsDeleteError', errorMessage => {
  store.dispatch(
    notificationActions.notify(
      `${t(
        'System',
        'An error has occured while deleting a language:',
        null,
        false
      )}\n${errorMessage}`,
      'danger'
    )
  );
});

socket.on('documentProcessed', sharedId => {
  store.dispatch(documentProcessed(sharedId, 'library'));
});

socket.on('IMPORT_CSV_START', () => store.dispatch(actions.set('importStart', true)));
socket.on('IMPORT_CSV_PROGRESS', progress =>
  store.dispatch(actions.set('importProgress', progress))
);
socket.on('IMPORT_CSV_ERROR', error => store.dispatch(actions.set('importError', error)));
socket.on('IMPORT_CSV_END', () => store.dispatch(actions.set('importEnd', true)));
