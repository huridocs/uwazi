/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, render } from '@testing-library/react';
import { Provider as JotaiProvider, useAtomValue } from 'jotai';
import { Provider as ReduxProvider, useSelector } from 'react-redux';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router';
import { getStore } from '#shared/atomStore/index.js';
import { requestStatusAtom } from '#V2/atoms/requestStatusAtom.js';
import { loadingProgressBar } from '#app/App/LoadingProgressBar.js';
import { RouteHandler } from '#app/App/RouteHandler.js';
import { LibraryCards } from '#app/Library/LibraryCards.js';
import { searchDocuments } from '#app/Library/actions/libraryActions.js';
import { SearchAPI } from '#app/Search/SearchAPI.js';
import { create } from '#app/store.js';

let fetches = 0;
const events: string[] = [];

const Layout = () => {
  const loading = useAtomValue(requestStatusAtom).isLoading;
  const locale = useSelector((state: { locale?: string }) => state.locale);
  return (
    <>
      <span data-testid="status">{`${loading ? 'loading' : 'idle'}:${locale ?? ''}`}</span>
      <Outlet />
    </>
  );
};

const seedLibraryStore = () => {
  const reduxStore = create();
  reduxStore.dispatch({
    type: 'settings/collection/SET',
    value: { languages: [{ key: 'en', label: 'English', default: true }] },
  });
  reduxStore.dispatch({ type: 'templates/SET', value: [] });
  reduxStore.dispatch({ type: 'thesauris/SET', value: [] });
  reduxStore.dispatch({ type: 'auth/user/SET', value: {} });
  return reduxStore;
};

const libraryRouter = () =>
  createMemoryRouter(
    [
      {
        element: <Layout />,
        children: [
          { path: '/settings', element: <div>settings</div> },
          { path: '/library', element: <LibraryCards /> },
        ],
      },
    ],
    { initialEntries: ['/settings'] }
  );

const dispatchSearch = async (
  store: ReturnType<typeof create>,
  location: { pathname: string; search: string },
  navigate: jest.Mock
) => {
  await store.dispatch(searchDocuments({ location, navigate }));
  const target = navigate.mock.calls.at(-1)?.[0];
  return typeof target === 'string' ? target : '';
};

describe('searchDocuments url updates', () => {
  it('does not change q once the url already matches the search', async () => {
    const store = create();
    store.dispatch({
      type: 'settings/collection/SET',
      value: { languages: [{ key: 'en', default: true }] },
    });
    store.dispatch({ type: 'templates/SET', value: [] });
    const navigate = jest.fn();
    const first = await dispatchSearch(store, { pathname: '/en/library', search: '' }, navigate);
    const search = first.includes('?') ? first.slice(first.indexOf('?')) : '';
    navigate.mockClear();
    const second = await dispatchSearch(store, { pathname: '/en/library', search }, navigate);
    expect(second).toBe(first);
  });
});

describe('client navigation into the library', () => {
  const { componentDidMount } = RouteHandler.prototype;

  beforeEach(() => {
    fetches = 0;
    events.length = 0;
    RouteHandler.renderedFromServer = false;
    loadingProgressBar.requests = 0;
    jest.spyOn(SearchAPI, 'search').mockImplementation(async () => {
      events.push('search');
      fetches += 1;
      if (fetches > 5) {
        throw new Error('search storm');
      }
      return { rows: [{ _id: '1', title: 'Doc', sharedId: 's1' }], totalRows: 1, aggregations: {} };
    });
    jest.spyOn(RouteHandler.prototype, 'componentDidMount').mockImplementation(function recordMount(
      this: RouteHandler
    ) {
      events.push('mount');
      componentDidMount.call(this);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const openLibrary = async () => {
    const router = libraryRouter();
    render(
      <ReduxProvider store={seedLibraryStore()}>
        <JotaiProvider store={getStore()}>
          <RouterProvider router={router} />
        </JotaiProvider>
      </ReduxProvider>
    );
    await act(async () => {
      await router.navigate('/library');
    });
    await act(async () => {
      await new Promise(resolve => {
        setTimeout(resolve, 1200);
      });
    });
  };

  it('requests the library once, after mount', async () => {
    await openLibrary();

    expect(events.indexOf('search')).toBeGreaterThan(events.indexOf('mount'));
    expect(fetches).toBe(1);
  });

  it('requests the library when the hydrated page was not the library', async () => {
    RouteHandler.renderedFromServer = true;
    await openLibrary();

    expect(fetches).toBe(1);
  });
});
