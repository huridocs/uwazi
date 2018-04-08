import { actions as formActions } from 'react-redux-form';
import * as notifications from 'app/Notifications/actions/notificationsActions';
import { store } from 'app/store';
import t from '../t';
import I18NApi from '../I18NApi';

export function inlineEditTranslation(contextId, key) {
  return (dispatch) => {
    const state = store.getState();
    const translations = state.translations.toJS();
    const languages = translations.map(_t => _t.locale);
    const formData = languages.reduce((values, locale) => {
      const translation = translations.find(_t => _t.locale === locale);
      const context = translation.contexts.find(c => c.id === contextId);
      values[locale] = context.values[key] || key;
      return values;
    }, {});

    dispatch({ type: 'OPEN_INLINE_EDIT_FORM', context: contextId, key });
    dispatch(formActions.load('inlineEditModel', formData));
  };
}

export function closeInlineEditTranslation() {
  return (dispatch) => {
    dispatch({ type: 'CLOSE_INLINE_EDIT_FORM' });
    dispatch(formActions.reset('inlineEditModel'));
  };
}

export function toggleInlineEdit() {
  return { type: 'TOGGLE_INLINE_EDIT' };
}

export function saveTranslations(translations) {
  return (dispatch) => {
    Promise.all(translations.map(translation => I18NApi.save(translation)))
    .then(() => {
      notifications.notify(t('System', 'Translations saved'), 'success')(dispatch);
    });
  };
}

export function editTranslations(translations) {
  return (dispatch) => {
    dispatch(formActions.load('translationsForm', translations));
  };
}

export function resetForm() {
  return (dispatch) => {
    dispatch(formActions.reset('translationsForm'));
  };
}
