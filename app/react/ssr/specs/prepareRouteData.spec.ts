import type { RouteObject } from 'react-router';
import { createLibraryLoader } from '#V2/Routes/Library/loader.js';
import { createTestServices } from '#V2/testing/createTestServices.js';
import { prepareRouteData } from '../prepareRouteData.js';

const searchLibrary = jest.fn();

const libraryRoutes = (): RouteObject[] => {
  const loader = createLibraryLoader(createTestServices({ search: { searchLibrary } }))();
  return [
    {
      path: '/',
      children: [
        { path: 'library/*', loader },
        { path: 'en', children: [{ path: 'library/*', loader }] },
      ],
    },
  ];
};

const ssrRequest = (url: string) => new Request(url, { signal: new AbortController().signal });

const locationOf = (response: Response) => {
  const location = response.headers.get('Location');
  expect(location).toBeTruthy();
  return new URL(location as string, 'http://localhost:3000');
};

const expectLegacyRedirect = (
  result: Awaited<ReturnType<typeof prepareRouteData>>,
  expected: {
    expectPath: string;
    expectParams?: Record<string, string>;
    expectAbsentParams?: string[];
  }
) => {
  expect(result.kind).toBe('response');
  if (result.kind !== 'response') {
    return;
  }
  expect(result.response.status).toBeGreaterThanOrEqual(300);
  expect(result.response.status).toBeLessThan(400);
  const location = locationOf(result.response);
  expect(location.pathname).toBe(expected.expectPath);
  Object.entries(expected.expectParams ?? {}).forEach(([key, value]) => {
    expect(location.searchParams.get(key)).toBe(value);
  });
  (expected.expectAbsentParams ?? []).forEach(key => {
    expect(location.searchParams.get(key)).toBeNull();
  });
  expect(searchLibrary).not.toHaveBeenCalled();
};

const V1_LIBRARY_CORPUS: {
  name: string;
  url: string;
  expectPath: string;
  expectParams?: Record<string, string>;
  expectAbsentParams?: string[];
}[] = [
  {
    name: 'arroz bookmark with trailing slash and encoded quotes',
    url: 'http://localhost:3000/library/?q=(allAggregations:!f,from:0,includeUnpublished:!f,limit:30,order:desc,searchTerm:%27arroz%27,sort:_score,treatAs:number,unpublished:!f)',
    expectPath: '/library',
    expectParams: { search: 'arroz', sort: '_score' },
    expectAbsentParams: ['q'],
  },
  {
    name: 'same arroz bookmark without trailing slash',
    url: 'http://localhost:3000/library?q=(allAggregations:!f,from:0,includeUnpublished:!f,limit:30,order:desc,searchTerm:%27arroz%27,sort:_score,treatAs:number,unpublished:!f)',
    expectPath: '/library',
    expectParams: { search: 'arroz', sort: '_score' },
    expectAbsentParams: ['q'],
  },
  {
    name: 'locale-prefixed rison',
    url: "http://localhost:3000/en/library?q=(searchTerm:'arroz',sort:_score)",
    expectPath: '/en/library',
    expectParams: { search: 'arroz', sort: '_score' },
    expectAbsentParams: ['q'],
  },
  {
    name: 'table path view',
    url: 'http://localhost:3000/library/table?q=(from:0,limit:30,order:asc,sort:title,unpublished:!f)',
    expectPath: '/library',
    expectParams: { view: 'table', sort: 'title', order: 'asc' },
    expectAbsentParams: ['q'],
  },
  {
    name: 'map path view',
    url: 'http://localhost:3000/library/map?q=(from:0,limit:30,unpublished:!f)',
    expectPath: '/library',
    expectParams: { view: 'map' },
    expectAbsentParams: ['q'],
  },
  {
    name: 'searchTerm with spaces',
    url: "http://localhost:3000/library?q=(searchTerm:'foo bar',sort:_score)",
    expectPath: '/library',
    expectParams: { search: 'foo bar', sort: '_score' },
    expectAbsentParams: ['q'],
  },
  {
    name: 'searchTerm with percent sign',
    url: "http://localhost:3000/library?q=(searchTerm:'100%')",
    expectPath: '/library',
    expectParams: { search: '100%' },
    expectAbsentParams: ['q'],
  },
  {
    name: 'empty searchTerm',
    url: "http://localhost:3000/library?q=(searchTerm:'',unpublished:!f)",
    expectPath: '/library',
    expectAbsentParams: ['q', 'search'],
  },
  {
    name: 'types and property filters',
    url: "http://localhost:3000/library?q=(types:!('t1'),filters:(country:!(ES)))",
    expectPath: '/library',
    expectParams: { filters: '(type:(t1),country:(ES))' },
    expectAbsentParams: ['q'],
  },
  {
    name: 'unpublished only',
    url: 'http://localhost:3000/library?q=(unpublished:!t,includeUnpublished:!f)',
    expectPath: '/library',
    expectParams: { filters: '(status:(restricted))' },
    expectAbsentParams: ['q'],
  },
  {
    name: 'includeUnpublished all',
    url: 'http://localhost:3000/library?q=(includeUnpublished:!t,limit:30)',
    expectPath: '/library',
    expectAbsentParams: ['q', 'filters'],
  },
  {
    name: 'malformed rison must not 500',
    url: 'http://localhost:3000/library?q=(not-valid',
    expectPath: '/library',
    expectAbsentParams: ['q'],
  },
];

describe('prepareRouteData V1 library corpus', () => {
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

  it.each(V1_LIBRARY_CORPUS)(
    'turns $name into a redirect instead of throwing',
    async ({ url, ...expected }) => {
      const result = await prepareRouteData(ssrRequest(url), libraryRoutes());
      expectLegacyRedirect(result, expected);
    }
  );

  it('still renders a compact V2 library URL', async () => {
    const result = await prepareRouteData(
      ssrRequest('http://localhost:3000/library?search=arroz&sort=_score'),
      libraryRoutes()
    );

    expect(result.kind).toBe('render');
    if (result.kind !== 'render') {
      return;
    }
    expect(result.staticHandleContext.loaderData).toBeDefined();
    expect(searchLibrary).toHaveBeenCalledWith(
      expect.objectContaining({ searchTerm: 'arroz' }),
      expect.anything()
    );
  });
});
