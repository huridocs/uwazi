"use strict";var _store = require("../../../store");
var _immutable = _interopRequireDefault(require("immutable"));
var _blankState = _interopRequireDefault(require("../blankState"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('blankState()', () => {
  describe('when there is no thesauris', () => {
    it('it should return true', () => {
      spyOn(_store.store, 'getState').and.returnValue({ thesauris: [] });
      expect((0, _blankState.default)()).toBe(true);
    });
  });

  describe('when there is thesauris', () => {
    it('it should return true', () => {
      spyOn(_store.store, 'getState').and.returnValue({ thesauris: [_immutable.default.fromJS({ values: [{ a: 'a' }] })] });
      expect((0, _blankState.default)()).toBe(false);
    });
  });
});