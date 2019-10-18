"use strict";var _parsingUtils = _interopRequireDefault(require("../parsingUtils"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('Custom Hooks Parsing utils', () => {
  describe('findBucketsByCountry', () => {
    let set;

    beforeEach(() => {
      set = {
        aggregations: {
          all: {
            country1: {
              buckets: [{ key: 'keyA' }, { key: 'keyB' }] },

            country2: {
              buckets: [{ key: 'keyB' }, { key: 'keyC' }] } } } };




    });

    it('should find buckets that match country key', () => {
      expect(_parsingUtils.default.findBucketsByCountry(set, 'country2', 'keyC')).toBe(set.aggregations.all.country2.buckets[1]);
      expect(_parsingUtils.default.findBucketsByCountry(set, 'country1', 'keyA')).toBe(set.aggregations.all.country1.buckets[0]);
    });
  });
});