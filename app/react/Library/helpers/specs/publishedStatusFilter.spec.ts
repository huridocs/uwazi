import { queryToFilter, filterToQuery } from '../publishedStatusFilter';

describe('publishedStatus filter helpers', () => {
  describe('filterToQuery', () => {
    it('should return correct query parameters based on search parameters', () => {
      expect(
        filterToQuery({
          publishedStatus: {
            values: ['published', 'restricted'],
          },
        })
      ).toEqual({ includeUnpublished: true, unpublished: false });

      expect(
        filterToQuery({
          publishedStatus: {
            values: ['published'],
          },
        })
      ).toEqual({ includeUnpublished: false, unpublished: false });

      expect(
        filterToQuery({
          publishedStatus: {
            values: ['restricted'],
          },
        })
      ).toEqual({ includeUnpublished: false, unpublished: true });

      expect(
        filterToQuery({
          publishedStatus: {
            values: [],
          },
        })
      ).toEqual({ includeUnpublished: true, unpublished: false });

      expect(
        filterToQuery({
          publishedStatus: {
            values: ['published', 'restricted', 'invalid parameter'],
          },
        })
      ).toEqual({ includeUnpublished: true, unpublished: false });
    });
  });

  describe('queryToFilter', () => {
    it.each`
      unpublished | includeUnpublished | result
      ${false}    | ${false}           | ${{ values: ['published'] }}
      ${true}     | ${false}           | ${{ values: ['restricted'] }}
      ${false}    | ${true}            | ${{ values: ['published', 'restricted'] }}
    `(
      'should set publishedStatus parameters based on query parameters',
      ({ unpublished, includeUnpublished, result }) => {
        expect(queryToFilter(unpublished, includeUnpublished)).toEqual(result);
      }
    );
  });
});
