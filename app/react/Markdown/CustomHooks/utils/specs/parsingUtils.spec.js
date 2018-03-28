import { findBucketsByCountry } from '../parsingUtils';

describe('Custom Hooks Parsing utils', () => {
  describe('findBucketsByCountry', () => {
    let set;

    beforeEach(() => {
      set = {
        aggregations: {
          all: {
            country1: {
              buckets: [{ key: 'keyA' }, { key: 'keyB' }]
            },
            country2: {
              buckets: [{ key: 'keyB' }, { key: 'keyC' }]
            }
          }
        }
      };
    });

    it('should find buckets that match country key', () => {
      expect(findBucketsByCountry(set, 'country2', 'keyC')).toBe(set.aggregations.all.country2.buckets[1]);
      expect(findBucketsByCountry(set, 'country1', 'keyA')).toBe(set.aggregations.all.country1.buckets[0]);
    });
  });
});
