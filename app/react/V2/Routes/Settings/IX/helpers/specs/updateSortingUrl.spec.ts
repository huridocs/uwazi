import { SortingState } from '@tanstack/react-table';
import { updateSortingUrl } from '../updateSortingUrl';

describe('updateSortingUrl', () => {
  const basePath = '/settings/metadata_extraction/suggestions/123';
  const baseSearchParams = new URLSearchParams('page=1');
  const filter = {
    labeled: false,
    nonLabeled: true,
    match: false,
    mismatch: true,
    obsolete: false,
    error: false,
  };

  it('adds sort parameter when valid sorting is provided', () => {
    let sorting: SortingState = [{ id: 'entityTitle', desc: false }];
    let result = updateSortingUrl(sorting, basePath, baseSearchParams);

    const expectedSort = encodeURIComponent('{"property":"entityTitle","order":"asc"}');
    expect(result).toBe(`${basePath}?page=1&sort=${expectedSort}`);

    sorting = [{ id: 'segment', desc: true }];
    result = updateSortingUrl(sorting, basePath, baseSearchParams);

    const expectedSort2 = encodeURIComponent('{"property":"segment","order":"desc"}');
    expect(result).toBe(`${basePath}?page=1&sort=${expectedSort2}`);
  });

  it('removes sort parameter when sorting is empty', () => {
    const sorting: SortingState = [];
    const searchParams = new URLSearchParams(
      'page=1&sort={"property":"entityTitle","order":"asc"}'
    );
    const result = updateSortingUrl(sorting, basePath, searchParams);

    expect(result).toBe(`${basePath}?page=1`);
  });

  it('preserves existing parameters when modifying sort', () => {
    const searchParams = new URLSearchParams();
    searchParams.set('page', '1');
    searchParams.set('filter', JSON.stringify(filter));

    let sorting: SortingState = [{ id: 'entityTitle', desc: false }];
    let result = updateSortingUrl(sorting, basePath, searchParams);

    const expectedSort = encodeURIComponent('{"property":"entityTitle","order":"asc"}');
    expect(result).toBe(`${basePath}?${searchParams.toString()}&sort=${expectedSort}`);

    sorting = [];
    result = updateSortingUrl(sorting, basePath, searchParams);
    expect(result).toBe(`${basePath}?${searchParams.toString()}`);
  });
});
