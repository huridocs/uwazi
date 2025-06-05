import { SortingState } from '@tanstack/react-table';
import { updateSortingUrl } from '../updateSortingUrl';

describe('updateSortingUrl', () => {
  const basePath = '/settings/metadata_extraction/suggestions/123';
  const baseSearchParams = new URLSearchParams('page=1');

  it('adds sort parameter when valid sorting is provided', () => {
    let sorting: SortingState = [{ id: 'entityTitle', desc: false }];
    let result = updateSortingUrl(sorting, basePath, baseSearchParams);

    expect(result).toBe(
      `${basePath}?page=1&sort=%7B%22property%22%3A%22entityTitle%22%2C%22order%22%3A%22asc%22%7D`
    );

    sorting = [{ id: 'segment', desc: true }];
    result = updateSortingUrl(sorting, basePath, baseSearchParams);

    expect(result).toBe(
      `${basePath}?page=1&sort=%7B%22property%22%3A%22segment%22%2C%22order%22%3A%22desc%22%7D`
    );
  });

  it('removes sort parameter when sorting is empty', () => {
    const sorting: SortingState = [];
    const searchParams = new URLSearchParams(
      'page=1&sort=%7B%22property%22%3A%22entityTitle%22%2C%22order%22%3A%22asc%22%7D'
    );
    const result = updateSortingUrl(sorting, basePath, searchParams);

    expect(result).toBe(`${basePath}?page=1`);
  });

  it('preserves existing parameters when adding sort', () => {
    const sorting: SortingState = [{ id: 'entityTitle', desc: false }];
    const searchParams = new URLSearchParams('page=2&filter=test');
    const result = updateSortingUrl(sorting, basePath, searchParams);

    expect(result).toBe(
      `${basePath}?page=2&filter=test&sort=%7B%22property%22%3A%22entityTitle%22%2C%22order%22%3A%22asc%22%7D`
    );
  });
});
