"use strict";var _sortThesauri = _interopRequireDefault(require("../sortThesauri"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('Sort Thesauri List', () => {
  describe('sortThesauriList', () => {
    it('should sort the thesauri by name', () => {
      const unsortedValues = [
      { name: 'Ba' },
      { name: 'ab' },
      { name: 'za' },
      { name: 'Xi' }];


      expect((0, _sortThesauri.default)(unsortedValues)[0]).toEqual({ name: 'ab' });
      expect((0, _sortThesauri.default)(unsortedValues)[1]).toEqual({ name: 'Ba' });
      expect((0, _sortThesauri.default)(unsortedValues)[2]).toEqual({ name: 'Xi' });
      expect((0, _sortThesauri.default)(unsortedValues)[3]).toEqual({ name: 'za' });
    });
  });
});