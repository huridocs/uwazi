import ValidationError from 'ajv/dist/runtime/validation_error';
import { validation } from 'api/utils';
import { searchParamsSchema } from 'shared/types/searchParameterSchema';

describe('search schema', () => {
  const validQuery = {
    allAggregations: false,
    filters: { select: { values: ['selectValue'] } },
    from: 0,
    includeUnpublished: false,
    userSelectedSorting: true,
    limit: 30,
    order: 'desc',
    searchTerm: 'search',
    sort: '_score',
    types: ['templateId'],
    unpublished: true,
    geolocation: true,
    treatAs: 'dottedList',
    fields: ['title'],
  };

  describe('valid cases', () => {
    function expectValidSchema(result: Object) {
      expect(result).toBeUndefined();
    }

    it('should not have validation errors for valid search', async () => {
      const validSearch = { validQuery };
      await validation.validateRequest(searchParamsSchema)(validSearch, null, expectValidSchema);
    });

    it('should support a number as a search term', async () => {
      const validSearch = { query: { ...validQuery, searchTerm: 3 } };
      await validation.validateRequest(searchParamsSchema)(validSearch, null, expectValidSchema);
    });
  });

  describe('invalid cases', () => {
    function expectInvalidSchema(result: ValidationError) {
      expect(result.errors.length).toBeGreaterThan(0);
    }

    async function testInvalidProperty(invalidProperty: any) {
      const invalidSearch = { query: { ...validQuery, ...invalidProperty } };
      await validation.validateRequest(searchParamsSchema)(
        invalidSearch,
        null,
        expectInvalidSchema
      );
    }

    it('should be invalid if allAgregations is not a boolean value', async () => {
      await testInvalidProperty({ allAggregations: 'text' });
    });

    it('should be invalid if filters is not a valid object', async () => {
      await testInvalidProperty({ filters: 'text' });
    });

    it('should be invalid if from is not a number', async () => {
      await testInvalidProperty({ from: 'text' });
    });

    it('should be invalid if includeUnpublished is not a boolean value', async () => {
      await testInvalidProperty({ includeUnpublished: 'text' });
    });

    it('should be invalid if userSelectedSorting is not a boolean value', async () => {
      await testInvalidProperty({ userSelectedSorting: 'text' });
    });

    it('should be invalid if limit is not a number', async () => {
      await testInvalidProperty({ limit: 'text' });
    });

    it('should be invalid if order is neither desc or asc', async () => {
      await testInvalidProperty({ order: 'ascendant' });
    });

    it('should be invalid if searchTerm is neither a number nor text', async () => {
      await testInvalidProperty({ searchTerm: true });
    });

    it('should be invalid if sort is not text', async () => {
      await testInvalidProperty({ sort: {} });
    });

    it('should be invalid if types is not an array of string', async () => {
      await testInvalidProperty({ types: [1, 2] });
    });

    it('should be invalid if unpublished is not a boolean value', async () => {
      await testInvalidProperty({ unpublished: 'true' });
    });

    it('should be invalid if geolocation is not a boolean value', async () => {
      await testInvalidProperty({ geolocation: 'false' });
    });

    it('should be invalid if treatAs is not a string', async () => {
      await testInvalidProperty({ treatAs: 1 });
    });

    it('should be invalid if fields is not an array of string', async () => {
      await testInvalidProperty({ fields: 'title' });
    });
  });
});
