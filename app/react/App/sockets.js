import { actions } from '#app/BasicReducer/index.js';
import { getStore } from '#shared/atomStore/index.js';
import { t } from '#app/I18N/index.js';
import { documentProcessed } from '#app/Uploads/actions/uploadsActions.js';
import { settingsAtom, templatesAtom, thesauriAtom, translationsAtom } from '#V2/atoms/index.js';
import { mergeClientSettings } from '#V2/atoms/mergeClientSettings.js';
import { setConnected, endTask, notify as bridgeNotify } from '#V2/utils/notifyBridge.js';
import { notificationActions } from '#app/Notifications/index.js';
import { store } from '../store.js';
import { socket, reconnectSocket } from '../socket.js';

let disconnectTimer;
let wasDisconnectedByOutage = false;

socket.on('disconnect', reason => {
  // 'io client disconnect' is a deliberate client-side call — not a real outage.
  if (reason === 'io client disconnect') return;

  // Always attempt to reconnect — socket.io only auto-reconnects for transport-level
  // disconnects; for any server-initiated disconnect it stops. Polling here covers all cases.
  const attemptReconnect = () => {
    if (!socket.connected) {
      socket.connect();
      setTimeout(attemptReconnect, 3000);
    }
  };
  setTimeout(attemptReconnect, 2000);

  disconnectTimer = setTimeout(() => {
    wasDisconnectedByOutage = true;
    setConnected(false);
    const message = t(
      'System',
      'Lost connection to the server. Your changes may be lost',
      null,
      false
    );
    bridgeNotify(message, 'warning');
    store.dispatch(notificationActions.notify(message, 'warning'));
  }, 8000);
});

// socket.on('connect') fires on every namespace-level connection:
// both automatic transport reconnects AND manual socket.connect() calls.
const onRecoveredConnection = () => {
  clearTimeout(disconnectTimer);
  setConnected(true);
  if (wasDisconnectedByOutage) {
    wasDisconnectedByOutage = false;
    const message = t('System', 'Connected to server', null, false);
    bridgeNotify(message, 'success');
    store.dispatch(notificationActions.notify(message, 'success'));
  }
};

socket.on('connect', onRecoveredConnection);
socket.io.on('reconnect', onRecoveredConnection);

socket.on('forceReconnect', () => {
  reconnectSocket();
});

socket.on('templateChange', template => {
  const atomStore = getStore();
  const currentTemplates = atomStore.get(templatesAtom);
  const index = currentTemplates.findIndex(current => current._id === template._id);
  atomStore.set(
    templatesAtom,
    index === -1
      ? [...currentTemplates, template]
      : [...currentTemplates.slice(0, index), template, ...currentTemplates.slice(index + 1)]
  );
});

socket.on('templateDelete', payload => {
  const atomStore = getStore();
  const updatedTemplates = atomStore
    .get(templatesAtom)
    .filter(currentTemplate => currentTemplate._id !== payload._id);
  atomStore.set(templatesAtom, updatedTemplates);
});

socket.on('updateSettings', settings => {
  const atomStore = getStore();
  atomStore.set(settingsAtom, prev => mergeClientSettings(prev, settings));
});

socket.on('thesauriChange', thesaurus => {
  const atomStore = getStore();
  const currentThesauri = atomStore.get(thesauriAtom);
  const index = currentThesauri.findIndex(current => current._id === thesaurus._id);
  atomStore.set(
    thesauriAtom,
    index === -1
      ? [...currentThesauri, thesaurus]
      : [...currentThesauri.slice(0, index), thesaurus, ...currentThesauri.slice(index + 1)]
  );
  store?.dispatch(actions.update('thesauris', thesaurus));
});

socket.on('thesauriDelete', payload => {
  const atomStore = getStore();
  const updatedThesauri = atomStore
    .get(thesauriAtom)
    .filter(currentThesauri => currentThesauri._id !== payload._id);
  atomStore.set(thesauriAtom, updatedThesauri);
});

socket.on('translationsChange', languageTranslations => {
  const atomStore = getStore();
  const translations = atomStore.get(translationsAtom);
  // SSR only hydrates the active locale; ignore updates for other languages.
  const modifiedLanguage = translations.find(
    translation => translation.locale === languageTranslations.locale
  );
  if (!modifiedLanguage) {
    return;
  }
  modifiedLanguage.contexts = languageTranslations.contexts;
  atomStore.set(translationsAtom, [...translations]);
});

socket.on('translationKeysChange', translationsEntries => {
  const atomStore = getStore();
  const translations = atomStore.get(translationsAtom);
  let hasUpdates = false;
  translationsEntries.forEach(item => {
    const translation = translations.find(t => t.locale === item.language);
    const modifiedContext = translation?.contexts.find(c => c.id && c.id === item.context.id);
    if (!modifiedContext) {
      return;
    }
    modifiedContext.values[item.key] = item.value;
    hasUpdates = true;
  });
  if (hasUpdates) {
    atomStore.set(translationsAtom, [...translations]);
  }
});

socket.on('translationsInstallDone', () => {
  endTask('language-install', 'completed');
  store.dispatch(
    notificationActions.notify(
      t('System', 'Languages installed successfully', null, false),
      'success'
    )
  );
});

socket.on('translationsInstallError', errorMessage => {
  endTask('language-install', 'failed');
  const message = `${t('System', 'An error has occured while installing languages:', null, false)}
${errorMessage}`;
  bridgeNotify(
    t('System', 'An error has occurred while installing languages:', null, false),
    'error'
  );
  store.dispatch(notificationActions.notify(message, 'danger'));
});

socket.on('translationsDelete', locale => {
  const atomStore = getStore();
  const translations = atomStore.get(translationsAtom);
  const updatedTranslations = translations.filter(language => language.locale !== locale);
  atomStore.set(translationsAtom, [...updatedTranslations]);
});

socket.on('translationsDeleteDone', () => {
  endTask('language-uninstall', 'completed');
  store.dispatch(
    notificationActions.notify(
      t('System', 'Language uninstalled successfully', null, false),
      'success'
    )
  );
});

socket.on('translationsDeleteError', errorMessage => {
  endTask('language-uninstall', 'failed');
  const message = `${t('System', 'An error has occured while deleting a language:', null, false)}
${errorMessage}`;
  bridgeNotify(
    t('System', 'An error has occurred while uninstalling a language:', null, false),
    'error'
  );
  store.dispatch(notificationActions.notify(message, 'danger'));
});

socket.on('documentProcessed', sharedId => {
  store.dispatch(documentProcessed(sharedId, 'library'));
});

socket.on('conversionFailed', sharedId => {
  store.dispatch(documentProcessed(sharedId, 'library'));
});
