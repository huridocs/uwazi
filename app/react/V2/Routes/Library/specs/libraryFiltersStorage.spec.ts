/**
 * @jest-environment jsdom
 */
import {
  LIBRARY_FILTERS_STORAGE_KEY,
  readStoredLibraryFilters,
  restoreLibraryFiltersFromStorage,
  storedLibraryFiltersFromPatch,
  writeStoredLibraryFilters,
} from '../libraryFiltersStorage.js';

describe('libraryFiltersStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('writes filters as soon as they change', () => {
    writeStoredLibraryFilters({
      filters: { type: ['tpl-org'], country: ['ES'] },
      andFilters: ['country'],
    });

    expect(JSON.parse(window.localStorage.getItem(LIBRARY_FILTERS_STORAGE_KEY) || '')).toEqual({
      filters: { type: ['tpl-org'], country: ['ES'] },
      andFilters: ['country'],
    });
  });

  it('reads stored filters and ignores invalid payloads', () => {
    window.localStorage.setItem(
      LIBRARY_FILTERS_STORAGE_KEY,
      JSON.stringify({ filters: { type: ['tpl-a'] }, andFilters: ['type'] })
    );
    expect(readStoredLibraryFilters()).toEqual({
      filters: { type: ['tpl-a'] },
      andFilters: ['type'],
    });

    window.localStorage.setItem(LIBRARY_FILTERS_STORAGE_KEY, '{not-json');
    expect(readStoredLibraryFilters()).toEqual({ filters: {}, andFilters: [] });
  });

  it('restores stored filters only when the URL has none', () => {
    const stored = { filters: { type: ['tpl-org'] }, andFilters: ['country'] };

    expect(restoreLibraryFiltersFromStorage({ filters: {}, andFilters: [] }, stored)).toEqual(
      stored
    );
    expect(
      restoreLibraryFiltersFromStorage(
        { filters: { type: ['tpl-person'] }, andFilters: [] },
        stored
      )
    ).toBeNull();
    expect(
      restoreLibraryFiltersFromStorage(
        { filters: {}, andFilters: [] },
        { filters: {}, andFilters: [] }
      )
    ).toBeNull();
  });

  it('merges a filter patch with the current stored values', () => {
    expect(
      storedLibraryFiltersFromPatch(
        { filters: { type: ['tpl-b'] }, andFilters: null },
        { filters: { type: ['tpl-a'] }, andFilters: ['country'] }
      )
    ).toEqual({ filters: { type: ['tpl-b'] }, andFilters: [] });
  });
});
