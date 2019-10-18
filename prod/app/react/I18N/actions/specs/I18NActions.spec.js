"use strict";var _reactReduxForm = require("react-redux-form");
var _store = require("../../../store");
var _immutable = _interopRequireDefault(require("immutable"));
var _SettingsAPI = _interopRequireDefault(require("../../../Settings/SettingsAPI"));
var _BasicReducer = require("../../../BasicReducer");
var _RequestParams = require("../../../utils/RequestParams");

var _I18NApi = _interopRequireDefault(require("../../I18NApi"));
var actions = _interopRequireWildcard(require("../I18NActions"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('I18NActions', () => {
  const dispatch = jasmine.createSpy('dispatch');
  const translations = _immutable.default.fromJS([
  { locale: 'en', contexts: [{ id: 'System', values: { Search: 'Search' } }] },
  { locale: 'es', contexts: [{ id: 'System', values: { Search: 'Buscar' } }] }]);


  describe('inlineEditTranslation', () => {
    it('should dispatch an OPEN_INLINE_EDIT_FORM action with context and key given', () => {
      spyOn(_reactReduxForm.actions, 'load');
      spyOn(_store.store, 'getState').and.returnValue({ translations });
      actions.inlineEditTranslation('System', 'Search')(dispatch);
      expect(dispatch).toHaveBeenCalledWith({ type: 'OPEN_INLINE_EDIT_FORM', context: 'System', key: 'Search' });
      expect(_reactReduxForm.actions.load).toHaveBeenCalledWith('inlineEditModel', { en: 'Search', es: 'Buscar' });
    });
  });

  describe('closeInlineEditTranslation', () => {
    it('should dispatch an CLOSE_INLINE_EDIT_FORM action', () => {
      spyOn(_reactReduxForm.actions, 'reset');
      actions.closeInlineEditTranslation()(dispatch);
      expect(dispatch).toHaveBeenCalledWith({ type: 'CLOSE_INLINE_EDIT_FORM' });
      expect(_reactReduxForm.actions.reset).toHaveBeenCalledWith('inlineEditModel');
    });
  });

  describe('toggleInlineEdit', () => {
    it('should dispatch an TOGGLE_INLINE_EDIT action', () => {
      expect(actions.toggleInlineEdit()).toEqual({ type: 'TOGGLE_INLINE_EDIT' });
    });
  });

  describe('saveTranslations', () => {
    it('should request the I18NApi to save each translation', () => {
      spyOn(_I18NApi.default, 'save');
      const translation = [{ _id: 1 }, { _id: 2 }];
      actions.saveTranslations(translation)(dispatch);
      expect(_I18NApi.default.save).toHaveBeenCalledWith(new _RequestParams.RequestParams({ _id: 1 }));
      expect(_I18NApi.default.save).toHaveBeenCalledWith(new _RequestParams.RequestParams({ _id: 2 }));
    });
  });

  describe('editTranslations', () => {
    it('should load the translation in to the translations form', done => {
      spyOn(_reactReduxForm.actions, 'load').and.returnValue(() => {});
      const translation = [{ _id: 1 }, { _id: 2 }];
      actions.editTranslations(translation)(dispatch);
      expect(_reactReduxForm.actions.load).toHaveBeenCalledWith('translationsForm', translation);
      done();
    });
  });

  describe('resetForm', () => {
    it('should load the translation in to the translations form', done => {
      spyOn(_reactReduxForm.actions, 'reset').and.returnValue(() => {});
      actions.resetForm()(dispatch);
      expect(_reactReduxForm.actions.reset).toHaveBeenCalledWith('translationsForm');
      done();
    });
  });

  describe('addLanguage', () => {
    it('should request the I18NApi to add a language', done => {
      spyOn(_I18NApi.default, 'addLanguage').and.returnValue(Promise.resolve());
      spyOn(_SettingsAPI.default, 'get').and.returnValue(Promise.resolve({ collection: 'updated settings' }));
      spyOn(_BasicReducer.actions, 'set');
      actions.addLanguage({ label: 'Español', key: 'es' })(dispatch).then(() => {
        expect(_I18NApi.default.addLanguage).toHaveBeenCalledWith(new _RequestParams.RequestParams({ label: 'Español', key: 'es' }));
        done();
      });
    });
  });

  describe('deleteLanguage', () => {
    it('should request the I18NApi to add a language', done => {
      spyOn(_I18NApi.default, 'deleteLanguage').and.returnValue(Promise.resolve());
      spyOn(_SettingsAPI.default, 'get').and.returnValue(Promise.resolve({ collection: 'updated settings' }));
      spyOn(_BasicReducer.actions, 'set');
      actions.deleteLanguage('es')(dispatch).then(() => {
        expect(_I18NApi.default.deleteLanguage).toHaveBeenCalledWith(new _RequestParams.RequestParams({ key: 'es' }));
        done();
      });
    });
  });

  describe('setDefaultLanguage', () => {
    it('should request the I18NApi to add a language', done => {
      spyOn(_I18NApi.default, 'setDefaultLanguage').and.returnValue(Promise.resolve());
      actions.setDefaultLanguage('es')(dispatch).then(() => {
        expect(_I18NApi.default.setDefaultLanguage).toHaveBeenCalledWith(new _RequestParams.RequestParams({ key: 'es' }));
        done();
      });
    });
  });
});