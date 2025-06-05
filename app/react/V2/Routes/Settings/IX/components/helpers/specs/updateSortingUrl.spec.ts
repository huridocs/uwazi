import { updateSortingUrl } from '../updateSortingUrl';

describe('updateSortingUrl', () => {
  const basePath = '/settings/metadata_extraction/suggestions/123';
  const baseSearchParams = new URLSearchParams('page=1');

  it('adds sort parameter when valid sorting is provided', () => {
    const sorting = [{ id: 'entityTitle', desc: false }];
    const result = updateSortingUrl(sorting, basePath, baseSearchParams);

    expect(result).toBe(
      `${basePath}?page=1&sort=%7B%22property%22%3A%22entityTitle%22%2C%22order%22%3A%22asc%22%7D`
    );
  });

  it('adds desc sort parameter when desc is true', () => {
    const sorting = [{ id: 'entityTitle', desc: true }];
    const result = updateSortingUrl(sorting, basePath, baseSearchParams);

    expect(result).toBe(
      `${basePath}?page=1&sort=%7B%22property%22%3A%22entityTitle%22%2C%22order%22%3A%22desc%22%7D`
    );
  });

  it('removes sort parameter when sorting is empty', () => {
    const sorting: any[] = [];
    const searchParams = new URLSearchParams(
      'page=1&sort=%7B%22property%22%3A%22entityTitle%22%2C%22order%22%3A%22asc%22%7D'
    );
    const result = updateSortingUrl(sorting, basePath, searchParams);

    expect(result).toBe(`${basePath}?page=1`);
  });

  it('preserves existing parameters when adding sort', () => {
    const sorting = [{ id: 'entityTitle', desc: false }];
    const searchParams = new URLSearchParams('page=2&filter=test');
    const result = updateSortingUrl(sorting, basePath, searchParams);

    expect(result).toBe(
      `${basePath}?page=2&filter=test&sort=%7B%22property%22%3A%22entityTitle%22%2C%22order%22%3A%22asc%22%7D`
    );
  });

  it('ignores invalid sort properties', () => {
    const sorting = [{ id: 'invalidProperty', desc: false }];
    const result = updateSortingUrl(sorting, basePath, baseSearchParams);

    expect(result).toBe(`${basePath}?page=1`);
  });

  it('handles multiple sortable properties', () => {
    const properties = ['entityTitle', 'segment', 'currentValue'];

    properties.forEach(property => {
      const sorting = [{ id: property, desc: false }];
      const result = updateSortingUrl(sorting, basePath, baseSearchParams);

      expect(result).toBe(
        `${basePath}?page=1&sort=%7B%22property%22%3A%22${property}%22%2C%22order%22%3A%22asc%22%7D`
      );
    });
  });
});
