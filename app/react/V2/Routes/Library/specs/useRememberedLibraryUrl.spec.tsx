/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server.node';
import { hydrateRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router';
import {
  LIBRARY_FILTERS_STORAGE_KEY,
  writeStoredLibraryFilters,
} from '../libraryFiltersStorage.js';
import { useRememberedLibraryUrl } from '../useRememberedLibraryUrl.js';

const LibraryLink = ({ enabled = true }: { enabled?: boolean }) => (
  <a href={useRememberedLibraryUrl('/library/table', enabled)}>Library</a>
);

const navigation = (enabled = true) => (
  <MemoryRouter>
    <LibraryLink enabled={enabled} />
  </MemoryRouter>
);

const serverContainer = () => {
  const container = document.createElement('div');
  container.innerHTML = renderToString(navigation());
  return container;
};

describe('remembered Library URL hydration', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem(
      LIBRARY_FILTERS_STORAGE_KEY,
      JSON.stringify({ filters: { type: ['tpl-saved'] }, andFilters: ['type'] })
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('keeps server and initial client markup equal before reading remembered filters', async () => {
    const readStorage = jest.spyOn(Storage.prototype, 'getItem');
    const container = serverContainer();
    expect(readStorage).not.toHaveBeenCalled();
    expect(container.querySelector('a')).toHaveAttribute('href', '/library/table');

    const onRecoverableError = jest.fn();
    let root: ReturnType<typeof hydrateRoot>;
    await act(async () => {
      root = hydrateRoot(container, navigation(), { onRecoverableError });
    });

    expect(container.querySelector('a')).toHaveAttribute(
      'href',
      '/library/table?filters=(type:(tpl-saved))&andFilters=(type)'
    );
    expect(onRecoverableError).not.toHaveBeenCalled();
    await act(async () => root.unmount());
  });

  it('keeps the supplied path when Library V2 is disabled', () => {
    const readStorage = jest.spyOn(Storage.prototype, 'getItem');
    render(navigation(false));
    expect(screen.getByRole('link', { name: 'Library' })).toHaveAttribute('href', '/library/table');
    expect(readStorage).not.toHaveBeenCalled();
  });

  it('keeps the supplied path when stored filters are malformed', () => {
    window.localStorage.setItem(LIBRARY_FILTERS_STORAGE_KEY, '{invalid');
    render(navigation());
    expect(screen.getByRole('link', { name: 'Library' })).toHaveAttribute('href', '/library/table');
  });

  it('keeps the supplied path when storage is inaccessible', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Storage is unavailable', 'SecurityError');
    });
    render(navigation());
    expect(screen.getByRole('link', { name: 'Library' })).toHaveAttribute('href', '/library/table');
  });

  it('stops reading stored filters after the link unmounts', () => {
    const readStorage = jest.spyOn(Storage.prototype, 'getItem');
    const { unmount } = render(navigation());
    unmount();
    readStorage.mockClear();

    writeStoredLibraryFilters({ filters: { type: ['tpl-next'] }, andFilters: [] });

    expect(readStorage).not.toHaveBeenCalled();
  });
});
