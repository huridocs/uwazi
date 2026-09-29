import { runEntitySearch } from '../runEntitySearch.js';

describe('runEntitySearch', () => {
  it('full-text searches title, sharedId, and template only', async () => {
    const rows = [
      {
        _id: '1',
        title: 'Alpha',
        sharedId: 'a',
        template: 't',
        documents: [{ _id: 'doc-1', mimetype: 'application/pdf' }],
      },
    ];
    const searchFunction = jest.fn().mockResolvedValue([{ rows }]);
    const setSearchResults = jest.fn();
    const setIsSearching = jest.fn();

    await runEntitySearch({
      searchString: 'a',
      generation: 1,
      searchGeneration: { current: 1 },
      searchFunction,
      setSearchResults,
      setIsSearching,
    });

    expect(searchFunction).toHaveBeenCalledWith({
      searchTerm: 'a',
      publishedStatus: 'all',
      fields: ['title', 'sharedId', 'template'],
    });
    expect(setSearchResults).toHaveBeenCalledWith(rows);
    expect(setIsSearching).toHaveBeenCalledWith(false);
  });
});
