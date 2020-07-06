import { validation } from 'api/utils';
import { searchSchema } from 'api/search/searchSchema';

describe('search schema', () => {
  let search;

  beforeEach(() => {
    search = {
      query: {
        searchTerm: 'search',
      },
    };
  });
  function expectValidSchema(result) {
    expect(result).toBeUndefined();
  }

  describe('valid cases', () => {
    it('should not have validation errors for valid search', async () => {
      await validation.validateRequest(searchSchema)(search, null, expectValidSchema);
    });
    it('should support a number as a search term', async () => {
      search.query.searchTerm = 2;
      await validation.validateRequest(searchSchema)(search, null, expectValidSchema);
    });
  });
});
