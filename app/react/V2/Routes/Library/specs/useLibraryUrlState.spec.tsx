/**
 * @jest-environment jsdom
 */
import React from 'react';
import 'isomorphic-fetch';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v7';
import { LIBRARY_FILTERS_STORAGE_KEY } from '../libraryFiltersStorage.js';
import { useLibraryUrlState } from '../useLibraryUrlState.js';

const LibraryUrlState = () => {
  const { urlState, updateUrl } = useLibraryUrlState();
  return (
    <>
      <output data-testid="filters">{JSON.stringify(urlState.filters)}</output>
      <button
        type="button"
        onClick={() => updateUrl({ filters: { type: ['tpl-selected'] }, andFilters: ['type'] })}
      >
        Select type
      </button>
      <button type="button" onClick={() => updateUrl({ filters: null, andFilters: null })}>
        Clear filters
      </button>
    </>
  );
};

let disposeRouter: (() => void) | undefined;

const openLibrary = (url: string) => {
  window.history.replaceState(null, '', url);
  const router = createBrowserRouter([
    {
      path: '/en/library',
      element: (
        <NuqsAdapter>
          <LibraryUrlState />
        </NuqsAdapter>
      ),
    },
  ]);
  disposeRouter = router.dispose;
  render(<RouterProvider router={router} />);
  return router;
};

describe('library URL precedence over remembered filters', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem(
      LIBRARY_FILTERS_STORAGE_KEY,
      JSON.stringify({ filters: { type: ['tpl-saved'] }, andFilters: [] })
    );
  });

  afterEach(() => {
    disposeRouter?.();
  });

  it.each(['', '?search=example', '?filters=()', '?andFilters=(type)'])(
    'does not add remembered filters to an explicit URL with search %s',
    async search => {
      const router = openLibrary(`/en/library${search}`);

      await waitFor(() => expect(screen.getByTestId('filters').textContent).toBe('{}'));
      expect(router.state.location.search).toBe(search);
      expect(JSON.parse(window.localStorage.getItem(LIBRARY_FILTERS_STORAGE_KEY) || '')).toEqual({
        filters: { type: ['tpl-saved'] },
        andFilters: [],
      });
    }
  );

  it('keeps filters explicitly selected by the URL', async () => {
    const router = openLibrary('/en/library?filters=(type:(tpl-linked))');

    await waitFor(() =>
      expect(screen.getByTestId('filters').textContent).toBe('{"type":["tpl-linked"]}')
    );
    expect(router.state.location.search).toBe('?filters=(type:(tpl-linked))');
  });

  it('keeps explicit URLs authoritative when navigating back and forward', async () => {
    const router = openLibrary('/en/library?filters=(type:(tpl-linked))');
    await act(async () => router.navigate('/en/library'));
    await waitFor(() => expect(screen.getByTestId('filters').textContent).toBe('{}'));

    await act(async () => router.navigate(-1));
    await waitFor(() =>
      expect(screen.getByTestId('filters').textContent).toBe('{"type":["tpl-linked"]}')
    );
    await act(async () => router.navigate(1));
    await waitFor(() => expect(screen.getByTestId('filters').textContent).toBe('{}'));
  });

  it('remembers explicit filter changes and clearing filters', async () => {
    openLibrary('/en/library?filters=(type:(tpl-linked))');
    fireEvent.click(screen.getByRole('button', { name: 'Select type' }));
    expect(JSON.parse(window.localStorage.getItem(LIBRARY_FILTERS_STORAGE_KEY) || '')).toEqual({
      filters: { type: ['tpl-selected'] },
      andFilters: ['type'],
    });
    await waitFor(() =>
      expect(screen.getByTestId('filters').textContent).toBe('{"type":["tpl-selected"]}')
    );

    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(JSON.parse(window.localStorage.getItem(LIBRARY_FILTERS_STORAGE_KEY) || '')).toEqual({
      filters: {},
      andFilters: [],
    });
    await waitFor(() => expect(screen.getByTestId('filters').textContent).toBe('{}'));
  });
});
