import { actions } from 'app/BasicReducer';
import { t } from 'app/I18N';
import { notificationActions } from 'app/Notifications';
import { documentProcessed } from 'app/Uploads/actions/uploadsActions';
import { atomStore, settingsAtom, templatesAtom, thesauriAtom, translationsAtom } from 'V2/atoms';
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
  const updatedTemplates = atomStore
    .get(templatesAtom)
    .filter(currentTemplate => currentTemplate._id !== payload._id);
  atomStore.set(templatesAtom, updatedTemplates);
});

socket.on('updateSettings', settings => {
  atomStore.set(settingsAtom, settings);
});

socket.on('thesauriChange', thesaurus => {
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
  const updatedThesauri = atomStore
    .get(thesauriAtom)
    .filter(currentThesauri => currentThesauri._id !== payload._id);
  atomStore.set(thesauriAtom, updatedThesauri);
});

socket.on('translationsChange', languageTranslations => {
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
  const translations = atomStore.get(translationsAtom);
  const updatedTranslations = translations.filter(language => language.locale !== locale);
  atomStore.set(translationsAtom, [...updatedTranslations]);
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
