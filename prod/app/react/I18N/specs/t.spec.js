"use strict";var _store = require("../../store");
var _immutable = _interopRequireDefault(require("immutable"));
var _t = _interopRequireDefault(require("../t"));
var _I18NApi = _interopRequireDefault(require("../I18NApi"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('t', () => {
  let state;

  beforeEach(() => {
    _t.default.resetCachedTranslation();
    const dictionaries = [
    {
      locale: 'en',
      contexts: [
      {
        id: 'System',
        label: 'System',
        values: {
          Search: 'Search',
          confirmDeleteDocument: 'Are you sure you want to delete this document?',
          confirmDeleteEntity: 'Are you sure you want to delete this entity?' } }] },




    {
      locale: 'es',
      contexts: [
      {
        id: 'System',
        label: 'System',
        values: {
          Search: 'Buscar',
          confirmDeleteDocument: '¿Esta seguro que quiere borrar este documento?' } }] }];






    state = {
      locale: 'es',
      translations: _immutable.default.fromJS(dictionaries),
      user: _immutable.default.fromJS({ _id: 'abc' }) };


    spyOn(_store.store, 'getState').and.returnValue(state);
    spyOn(_I18NApi.default, 'addEntry');
  });

  it('should return the translation', () => {
    expect((0, _t.default)('System', 'confirmDeleteDocument', 'Are you sure you want to delete this document?')).
    toBe('¿Esta seguro que quiere borrar este documento?');
  });

  describe('when there is no translation', () => {
    it('should return the default text', () => {
      expect((0, _t.default)('System', 'confirmDeleteEntity', 'Are you sure you want to delete this entity?')).
      toBe('Are you sure you want to delete this entity?');
    });
  });

  describe('only passing context and key', () => {
    it('should use it as default text', () => {
      expect((0, _t.default)('System', 'not translated', 'not translated'));
    });
  });
});