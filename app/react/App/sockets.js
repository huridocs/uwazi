import { actions } from 'app/BasicReducer';
import { t, Translate } from 'app/I18N';
import { notify, removeNotification } from 'app/Notifications/actions/notificationsActions';
import { store } from '../store';
import socket from '../socket';

let disconnectNotifyId;
socket.on('disconnect', () => {
  if (disconnectNotifyId) {
    store.dispatch(removeNotification(disconnectNotifyId));
  }
  disconnectNotifyId = store.dispatch(notify('Lost connection to the server, your changes may be lost', 'danger', false));
});

socket.on('reconnect', () => {
  if (disconnectNotifyId) {
    store.dispatch(removeNotification(disconnectNotifyId));
  }
  disconnectNotifyId = store.dispatch(notify('Connected to server', 'success'));
});

socket.on('templateChange', (template) => {
  store.dispatch(actions.update('templates', template));
});
socket.on('templateDelete', (template) => {
  store.dispatch(actions.remove('templates', { _id: template.id }));
});

socket.on('updateSettings', (settings) => {
  store.dispatch(actions.set('settings/collection', settings));
});

socket.on('thesauriChange', (thesauri) => {
  store.dispatch(actions.update('thesauris', thesauri));
});
socket.on('thesauriDelete', (thesauri) => {
  store.dispatch(actions.remove('thesauris', { _id: thesauri.id }));
});

socket.on('translationsChange', (translations) => {
  store.dispatch(actions.update('translations', translations));
  t.resetCachedTranslation();
  Translate.resetCachedTranslation();
});
