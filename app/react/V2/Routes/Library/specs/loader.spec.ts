import { createLibraryLoader } from '../loader.js';
import { createTestServices } from '#V2/testing/createTestServices.js';

const searchLibrary = jest.fn();

const runLoader = (url: string) =>
  createLibraryLoader(createTestServices({ search: { searchLibrary } }))()({
    request: new Request(url),
    params: {},
    context: undefined,
  } as never);

describe('library loader', () => {
  beforeEach(() => {
    searchLibrary.mockReset();
    searchLibrary.mockResolvedValue([
      {
        rows: [{ title: 'Entity 1', sharedId: 'abc', template: 't1' }],
        totalRows: 1,
        aggregations: { templates: [], published: { published: 1, restricted: 0 }, properties: {} },
      },
    ]);
  });

  it('searches with parsed URL state', async () => {
    const result = await runLoader(
      'http://localhost/en/libraryv2?filters=(type:(t1))&search=batman&limit=10'
    );

    expect(searchLibrary).toHaveBeenCalledWith(
      expect.objectContaining({
        searchTerm: 'batman',
        templateIds: ['t1'],
        limit: 10,
        from: 0,
        publishedStatus: 'all',
      }),
      expect.anything()
    );
    expect(result).toMatchObject({
      totalRows: 1,
      urlState: expect.objectContaining({ search: 'batman', limit: 10 }),
    });
  });

  it('expands from+limit on cold load so previous rows are not dropped', async () => {
    await runLoader('http://localhost/en/libraryv2?from=30&limit=30');

    expect(searchLibrary).toHaveBeenCalledWith(
      expect.objectContaining({ from: 0, limit: 60 }),
      expect.anything()
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
    expect(searchLibrary).not.toHaveBeenCalled();
  });
});
