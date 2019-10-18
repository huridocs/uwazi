"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _immutable = _interopRequireDefault(require("immutable"));
var _I18N = require("../../../I18N");

var _TranslationsList = require("../TranslationsList");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('TranslationsList', () => {
  let component;
  let props;
  let context;

  beforeEach(() => {
    props = {
      translations: _immutable.default.fromJS([{
        locale: 'es',
        contexts: [
        { id: '1', label: 'X-Men' },
        { id: '2', label: 'Avengers' },
        { id: '3', label: 'Batman' }] }]),


      settings: _immutable.default.fromJS({ languages: [{ key: 'es', default: true }] }) };


    context = {
      confirm: jasmine.createSpy('confirm') };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_TranslationsList.TranslationsList, props), { context });
  };

  describe('render', () => {
    it('should a list of the different translations contexts', () => {
      render();
      const renderedContexts = component.find('ul.relation-types').find(_I18N.I18NLink);
      expect(renderedContexts.at(0).props().children).toBe('Avengers');
      expect(renderedContexts.at(2).props().children).toBe('Batman');
      expect(renderedContexts.at(4).props().children).toBe('X-Men');
    });
  });
});