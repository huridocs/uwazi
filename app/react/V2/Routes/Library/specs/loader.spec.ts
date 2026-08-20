import { SearchAPI } from '#app/Search/SearchAPI.js';
import { RequestParams } from '#app/utils/RequestParams.js';
import { createLibraryLoader } from '../loader.js';
import { createTestServices } from '#V2/testing/createTestServices.js';

jest.mock('#app/Search/SearchAPI.js', () => ({
  SearchAPI: {
    search: jest.fn(),
  },
}));

const searchMock = SearchAPI.search as jest.Mock;

const runLoader = (url: string) =>
  createLibraryLoader(createTestServices())()({
    request: new Request(url),
    params: {},
    context: undefined,
  } as never);

describe('library loader', () => {
  beforeEach(() => {
    searchMock.mockReset();
    searchMock.mockResolvedValue({
      rows: [{ title: 'Entity 1', sharedId: 'abc', template: 't1' }],
      totalRows: 1,
      aggregations: { all: { _types: { buckets: [] } } },
    });
  });

  it('searches with parsed URL state', async () => {
    const result = await runLoader(
      'http://localhost/en/libraryv2?filters=(type:(t1))&search=batman&limit=10'
    );

    expect(searchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          searchTerm: 'batman',
          types: ['t1'],
          limit: 10,
          from: 0,
        }),
      })
    );
    expect(result).toMatchObject({
      totalRows: 1,
      urlState: expect.objectContaining({ search: 'batman', limit: 10 }),
    });
  });

  it('expands from+limit on cold load so previous rows are not dropped', async () => {
    await runLoader('http://localhost/en/libraryv2?from=30&limit=30');

    expect(searchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ from: 0, limit: 60 }),
      })
    );
  });

  it('redirects legacy rison q= to the compact URL', async () => {
    const result = await runLoader(
      "http://localhost/en/libraryv2?q=(searchTerm:'batman',types:!('t1'),limit:10)"
    );

    expect(result).toBeInstanceOf(Response);
    const location = (result as Response).headers.get('Location');
    expect(location).toContain('/en/libraryv2?');
    expect(location).toContain('search=batman');
    expect(location).toContain('filters=(type:(t1))');
    expect(location).toContain('limit=10');
    expect(searchMock).not.toHaveBeenCalled();
  });

  it('passes RequestParams to SearchAPI', async () => {
    await runLoader('http://localhost/en/libraryv2');
    expect(searchMock.mock.calls[0][0]).toBeInstanceOf(RequestParams);
  });
});
