import { ApiError } from '#shared/apiClient/index.js';
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

  it('redirects when a property is not filterable for the selected type', async () => {
    const templates = jest.fn().mockResolvedValue([
      [
        {
          _id: 'contracts',
          name: 'Contracts',
          properties: [{ name: 'contracting', type: 'select', filter: true }],
        },
        {
          _id: 'contractors',
          name: 'Contractors',
          properties: [{ name: 'country', type: 'select', filter: true, defaultfilter: true }],
        },
      ],
    ]);
    const loader = createLibraryLoader(
      createTestServices({
        search: { searchLibrary },
        templates: { getAll: templates },
      })
    )();

    const result = await loader({
      request: new Request(
        'http://localhost/en/libraryv2?filters=(type:(contractors),contracting:(services))&andFilters=(contracting)'
      ),
      params: {},
      context: undefined,
    } as never);

    expect(searchLibrary).not.toHaveBeenCalled();
    expect(result).toBeInstanceOf(Response);
    expect((result as Response).headers.get('Location')).toBe(
      '/en/libraryv2?filters=(type:(contractors))'
    );
  });

  describe('when property filters need templates', () => {
    it('does not search a bookmark when templates cannot be loaded', async () => {
      const templates = jest
        .fn()
        .mockResolvedValue([undefined, new ApiError('fail', { kind: 'http', status: 500 })]);
      const loader = createLibraryLoader(
        createTestServices({
          search: { searchLibrary },
          templates: { getAll: templates },
        })
      )();

      await expect(
        loader({
          request: new Request(
            'http://localhost/en/libraryv2?filters=(type:(contractors),contracting:(services))'
          ),
          params: {},
          context: undefined,
        } as never)
      ).rejects.toBeTruthy();
      expect(searchLibrary).not.toHaveBeenCalled();
    });

    it('redirects a property filter when the collection has no templates', async () => {
      const templates = jest.fn().mockResolvedValue([[]]);
      const loader = createLibraryLoader(
        createTestServices({
          search: { searchLibrary },
          templates: { getAll: templates },
        })
      )();

      const result = await loader({
        request: new Request(
          'http://localhost/en/libraryv2?filters=(type:(contractors),contracting:(services))'
        ),
        params: {},
        context: undefined,
      } as never);

      expect(searchLibrary).not.toHaveBeenCalled();
      expect((result as Response).headers.get('Location')).toBe(
        '/en/libraryv2?filters=(type:(contractors))'
      );
    });
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

  it('requests one page slice and redirects a leftover from offset', async () => {
    await runLoader('http://localhost/en/libraryv2?page=2&limit=30');

    expect(searchLibrary).toHaveBeenCalledWith(
      expect.objectContaining({ from: 30, limit: 30 }),
      expect.anything()
    );

    const redirected = await runLoader('http://localhost/en/libraryv2?from=60&limit=30');
    expect(redirected).toBeInstanceOf(Response);
    expect((redirected as Response).headers.get('Location')).toBe('/en/libraryv2?limit=30&page=3');
    expect(searchLibrary).toHaveBeenCalledTimes(1);
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

  it('redirects a trailing-slash V1 library bookmark', async () => {
    const result = await runLoader(
      'http://localhost/en/library/?q=(allAggregations:!f,from:0,includeUnpublished:!f,limit:30,order:desc,searchTerm:%27arroz%27,sort:_score,treatAs:number,unpublished:!f)'
    );

    expect(result).toBeInstanceOf(Response);
    const location = (result as Response).headers.get('Location');
    expect(location).toBe(
      '/en/library?filters=(status:(published))&search=arroz&limit=30&sort=_score'
    );
    expect(searchLibrary).not.toHaveBeenCalled();
  });

  it('redirects /library/table rison URLs to view=table', async () => {
    const result = await runLoader(
      'http://localhost/en/library/table?q=(from:0,limit:30,order:asc,sort:title,unpublished:!f)'
    );

    expect(result).toBeInstanceOf(Response);
    const location = (result as Response).headers.get('Location');
    expect(location).toContain('/en/library?');
    expect(location).toContain('view=table');
    expect(location).toContain('sort=title');
    expect(location).toContain('order=asc');
    expect(searchLibrary).not.toHaveBeenCalled();
  });

  it('passes AND properties to searchLibrary', async () => {
    const templates = jest.fn().mockResolvedValue([
      [
        {
          _id: 't1',
          name: 'Doc',
          properties: [
            { name: 'descriptores', type: 'multiselect', filter: true, defaultfilter: true },
          ],
        },
      ],
    ]);
    const loader = createLibraryLoader(
      createTestServices({
        search: { searchLibrary },
        templates: { getAll: templates },
      })
    )();

    searchLibrary.mockResolvedValueOnce([
      {
        rows: [],
        totalRows: 0,
        aggregations: {
          templates: [],
          published: { published: 0, restricted: 0 },
          properties: { descriptores: [{ id: 'd1', label: 'Amenazas', count: 2 }] },
        },
      },
    ]);
    await loader({
      request: new Request(
        'http://localhost/en/libraryv2?filters=(descriptores:(d1,d2))&andFilters=(descriptores)'
      ),
      params: {},
      context: undefined,
    } as never);

    expect(searchLibrary).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: { descriptores: ['d1', 'd2'] },
        andFilters: ['descriptores'],
      }),
      expect.anything()
    );
  });

  it('fetches geolocation rows for map view while keeping list aggregations', async () => {
    const listResult = {
      rows: [{ title: 'Entity 1', sharedId: 'abc', template: 't1' }],
      totalRows: 8,
      aggregations: {
        templates: [{ id: 't1', count: 8 }],
        published: { published: 8, restricted: 0 },
        properties: {},
      },
    };
    const geoResult = {
      rows: [{ title: 'Geo entity', sharedId: 'geo-1', template: 't1' }],
      totalRows: 2,
      aggregations: { templates: [], published: { published: 0, restricted: 0 }, properties: {} },
    };
    searchLibrary.mockImplementation(async query => [query.geolocation ? geoResult : listResult]);

    const result = await runLoader('http://localhost/en/libraryv2?view=map&search=batman');

    expect(searchLibrary).toHaveBeenCalledWith(
      expect.not.objectContaining({ geolocation: true }),
      expect.anything()
    );
    expect(searchLibrary).toHaveBeenCalledWith(
      expect.objectContaining({
        searchTerm: 'batman',
        geolocation: true,
        from: 0,
        limit: 9999,
      }),
      expect.anything()
    );
    expect(result).toMatchObject({
      rows: geoResult.rows,
      totalRows: 2,
      aggregations: listResult.aggregations,
      urlState: expect.objectContaining({ view: 'map', search: 'batman' }),
    });
  });
});
