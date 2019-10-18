"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _reactReduxForm = require("react-redux-form");

var _immutable = _interopRequireDefault(require("immutable"));
var _EditTranslationForm = require("../EditTranslationForm");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('EditTranslationForm', () => {
  let component;
  let props;

  beforeEach(() => {
    const collectionSettings = _immutable.default.fromJS({
      languages: [{ key: 'en', label: 'English', default: true }, { key: 'es', label: 'Spanish', default: false }] });

    props = {
      saveTranslations: jasmine.createSpy('saveTranslations'),
      translationsForm: [
      { locale: 'en', contexts: [{ id: 'System', label: 'System', values: { User: 'User', Password: 'Password' } }] },
      { locale: 'es', contexts: [{ id: 'System', label: 'System', values: { User: 'Usuario', Password: 'Contraseña' } }] }],

      formState: {},
      settings: { collection: collectionSettings },
      context: 'System' };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_EditTranslationForm.EditTranslationForm, props));
  };

  describe('Render', () => {
    it('should render a form with fields for each value and each language', () => {
      render();
      const fields = component.find(_reactReduxForm.Field);
      expect(fields.length).toBe(4);
    });

    it('should render fields alphabetically', () => {
      render();
      const fields = component.find(_reactReduxForm.Field);
      expect(fields.at(0).props().model).toEqual(['translationsForm', 0, 'contexts', 0, 'values', 'Password']);
      expect(fields.at(2).props().model).toEqual(['translationsForm', 0, 'contexts', 0, 'values', 'User']);
    });
  });

  describe('submit', () => {
    it('should call saveTranslations only with the context beign edited', () => {
      render();
      const translations = [
      {
        locale: 'es',
        contexts: [
        { id: 'System', values: { hello: 'hola' } },
        { id: 'superheroes', values: { batman: 'joan' } }] },


      {
        locale: 'en',
        contexts: [
        { id: 'System', values: { hello: 'hello' } },
        { id: 'superheroes', values: { batman: 'batman' } }] }];




      const expectedSave = [
      { contexts: [{ id: 'System', values: { hello: 'hola' } }], locale: 'es' },
      { contexts: [{ id: 'System', values: { hello: 'hello' } }], locale: 'en' }];

      component.find(_reactReduxForm.Form).simulate('submit', translations);
      expect(props.saveTranslations).toHaveBeenCalledWith(expectedSave);
    });
  });
});