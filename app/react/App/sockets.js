import { actions } from '#app/BasicReducer/index.js';
import { getStore } from '#shared/atomStore/index.js';
import { t } from '#app/I18N/index.js';
import { notificationActions } from '#app/Notifications/index.js';
import { documentProcessed } from '#app/Uploads/actions/uploadsActions.js';
import { settingsAtom, templatesAtom, thesauriAtom, translationsAtom } from '#V2/atoms/index.js';
import { setConnected, endTask, notify as bridgeNotify } from '#V2/utils/notifyBridge.js';
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
    bridgeNotify(
      t('System', 'Lost connection to the server. Your changes may be lost', null, false),
      'warning'
    );
  }, 8000);
});

// socket.on('connect') fires on every namespace-level connection:
// both automatic transport reconnects AND manual socket.connect() calls.
socket.on('connect', () => {
  clearTimeout(disconnectTimer);
  setConnected(true);
  if (wasDisconnectedByOutage) {
    wasDisconnectedByOutage = false;
    bridgeNotify(t('System', 'Connection to the server has been restored', null, false), 'success');
  }
});

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
  atomStore.set(settingsAtom, settings);
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
  const modifiedLanguage = translations.find(
    translation => translation.locale === languageTranslations.locale
  );
  if (modifiedLanguage) {
    modifiedLanguage.contexts = languageTranslations.contexts;
  } else {
    translations.push(languageTranslations);
  }
  atomStore.set(translationsAtom, [...translations]);
});

socket.on('translationKeysChange', translationsEntries => {
  const atomStore = getStore();
  const translations = atomStore.get(translationsAtom);
  translationsEntries.forEach(item => {
    const modifiedContext = translations
      .find(translation => translation.locale === item.language)
      .contexts.find(c => c.id && c.id === item.context.id);
    modifiedContext.values[item.key] = item.value;
  });
  atomStore.set(translationsAtom, [...translations]);
});

socket.on('translationsInstallDone', () => {
  endTask('language-install', 'completed');
});

socket.on('translationsInstallError', errorMessage => {
  endTask('language-install', 'failed');
  bridgeNotify(
    t('System', 'An error has occurred while installing languages:', null, false),
    'error',
    errorMessage
  );
});

socket.on('translationsDelete', locale => {
  const atomStore = getStore();
  const translations = atomStore.get(translationsAtom);
  const updatedTranslations = translations.filter(language => language.locale !== locale);
  atomStore.set(translationsAtom, [...updatedTranslations]);
});

socket.on('translationsDeleteDone', () => {
  endTask('language-uninstall', 'completed');
});

socket.on('translationsDeleteError', errorMessage => {
  endTask('language-uninstall', 'failed');
  bridgeNotify(
    t('System', 'An error has occurred while uninstalling a language:', null, false),
    'error',
    errorMessage
  );
});

socket.on('documentProcessed', sharedId => {
  store.dispatch(documentProcessed(sharedId, 'library'));
});

socket.on('conversionFailed', sharedId => {
  store.dispatch(documentProcessed(sharedId, 'library'));
});

socket.on('IMPORT_CSV_START', () => store.dispatch(actions.set('importStart', true)));
socket.on('IMPORT_CSV_PROGRESS', progress =>
  store.dispatch(actions.set('importProgress', progress))
);
socket.on('IMPORT_CSV_ROW_EXCEPTIONS', exceptions =>
  store.dispatch(actions.set('importRowExceptions', exceptions))
);
socket.on('IMPORT_CSV_ERROR', error => store.dispatch(actions.set('importError', error)));
socket.on('IMPORT_CSV_END', () => store.dispatch(actions.set('importEnd', true)));
