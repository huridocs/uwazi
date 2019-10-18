"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.inlineEditTranslation = inlineEditTranslation;exports.closeInlineEditTranslation = closeInlineEditTranslation;exports.toggleInlineEdit = toggleInlineEdit;exports.saveTranslations = saveTranslations;exports.editTranslations = editTranslations;exports.resetForm = resetForm;exports.addLanguage = addLanguage;exports.deleteLanguage = deleteLanguage;exports.setDefaultLanguage = setDefaultLanguage;var _reactReduxForm = require("react-redux-form");
var notifications = _interopRequireWildcard(require("../../Notifications/actions/notificationsActions"));
var _store = require("../../store");
var _RequestParams = require("../../utils/RequestParams");

var _t = _interopRequireDefault(require("../t"));
var _I18NApi = _interopRequireDefault(require("../I18NApi"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}

function inlineEditTranslation(contextId, key) {
  return dispatch => {
    const state = _store.store.getState();
    const translations = state.translations.toJS();
    const languages = translations.map(_t => _t.locale);
    const formData = languages.reduce((values, locale) => {
      const translation = translations.find(_t => _t.locale === locale);
      const context = translation.contexts.find(c => c.id === contextId);
      values[locale] = context.values[key] || key; // eslint-disable-line no-param-reassign
      return values;
    }, {});

    dispatch({ type: 'OPEN_INLINE_EDIT_FORM', context: contextId, key });
    dispatch(_reactReduxForm.actions.load('inlineEditModel', formData));
  };
}

function closeInlineEditTranslation() {
  return dispatch => {
    dispatch({ type: 'CLOSE_INLINE_EDIT_FORM' });
    dispatch(_reactReduxForm.actions.reset('inlineEditModel'));
  };
}

function toggleInlineEdit() {
  return { type: 'TOGGLE_INLINE_EDIT' };
}

function saveTranslations(translations) {
  return dispatch => {
    Promise.all(translations.map(translation => _I18NApi.default.save(new _RequestParams.RequestParams(translation)))).
    then(() => {
      notifications.notify((0, _t.default)('System', 'Translations saved', null, false), 'success')(dispatch);
    });
  };
}

function editTranslations(translations) {
  return dispatch => {
    dispatch(_reactReduxForm.actions.load('translationsForm', translations));
  };
}

function resetForm() {
  return dispatch => {
    dispatch(_reactReduxForm.actions.reset('translationsForm'));
  };
}

function addLanguage(language) {
  return dispatch => _I18NApi.default.addLanguage(new _RequestParams.RequestParams(language)).
  then(() => {
    notifications.notify((0, _t.default)('System', 'New language added', null, false), 'success')(dispatch);
  });
}

function deleteLanguage(key) {
  return dispatch => _I18NApi.default.deleteLanguage(new _RequestParams.RequestParams({ key })).
  then(() => {
    notifications.notify((0, _t.default)('System', 'Language deleted', null, false), 'success')(dispatch);
  });
}

function setDefaultLanguage(key) {
  return dispatch => _I18NApi.default.setDefaultLanguage(new _RequestParams.RequestParams({ key })).
  then(() => {
    notifications.notify((0, _t.default)('System', 'Default language change success', null, false), 'success')(dispatch);
  });
}