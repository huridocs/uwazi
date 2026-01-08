/**
 * @jest-environment jsdom
 */
import { Entity } from 'V2/domain';
import * as files from 'V2/api/files';
import * as search from 'V2/api/search';
import * as container from 'V2/application/container/singletons';
import { entityLoader } from '../loader';
import { entityLoaderCache } from '../EntityLoaderCache';

jest.mock('V2/api/files');
jest.mock('V2/api/search');
jest.mock('V2/application/container/singletons');

describe('Entity loader with cache integration', () => {
  let mockEntity: Partial<Entity>;
  let mockCompositionUseCase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    entityLoaderCache.invalidateAll();

    mockEntity = {
      _id: 'entity1',
      sharedId: 'shared1',
      title: 'Test Entity',
      language: 'en',
      mainDocument: [{ _id: 'doc1', filename: 'test.pdf' }],
    };

    mockCompositionUseCase = { composeEntity: jest.fn() };
    (container.getEntityCompositionUseCase as jest.Mock).mockResolvedValue(mockCompositionUseCase);

    mockCompositionUseCase.composeEntity.mockResolvedValue({ success: true, entity: mockEntity });

    jest.spyOn(files, 'getPagePlaintext').mockResolvedValue('plaintext content');
  });

  const loadEntity = (url: string) => {
    const fullUrl = new URL(url);
    const pathParts = fullUrl.pathname.split('/');
    const sharedId = pathParts[pathParts.length - 1];

    return entityLoader()({
      params: { sharedId },
      request: { url } as Request,
      context: '',
    });
  };

  describe('Entity loading', () => {
    it('should fetch entity when not cached', async () => {
      await loadEntity('http://localhost/entity/shared1');

      expect(mockCompositionUseCase.composeEntity).toHaveBeenCalledTimes(1);
    });

    it('should use cached entity and not fetch again', async () => {
      await loadEntity('http://localhost/entity/shared1');

      await loadEntity('http://localhost/entity/shared1');

      expect(mockCompositionUseCase.composeEntity).toHaveBeenCalledTimes(1);
    });
  });

  describe('Plaintext loading', () => {
    it('should fetch plaintext when not cached', async () => {
      await loadEntity('http://localhost/entity/shared1?page=1&raw=true');

      expect(files.getPagePlaintext).toHaveBeenCalledWith('doc1', 1);
    });

    it('should use cached plaintext and not fetch again', async () => {
      await loadEntity('http://localhost/entity/shared1?page=1&raw=true');

      await loadEntity('http://localhost/entity/shared1?page=1&raw=true');

      expect(files.getPagePlaintext).toHaveBeenCalledTimes(1);
    });

    it('should use cached plaintext and not fetch again after switching pages', async () => {
      await loadEntity('http://localhost/entity/shared1?page=1&raw=true');

      await loadEntity('http://localhost/entity/shared1?page=2&raw=true');

      await loadEntity('http://localhost/entity/shared1?page=1&raw=true');

      expect(files.getPagePlaintext).toHaveBeenCalledTimes(2);
    });

    it('should not fetch if the view mode is not set for plaintext', async () => {
      await loadEntity('http://localhost/entity/shared1?page=1');

      await loadEntity('http://localhost/entity/shared1?page=2');

      await loadEntity('http://localhost/entity/shared1?page=1');

      expect(files.getPagePlaintext).not.toHaveBeenCalled();
    });
  });

  describe('Search results loading', () => {
    beforeAll(() => {
      jest.spyOn(search, 'snippets').mockResolvedValue('data' as any);
    });

    it('should fetch search results when not cached', async () => {
      await loadEntity('http://localhost/entity/shared1?searchTerm=test');

      expect(search.snippets).toHaveBeenCalledWith({
        sharedId: 'shared1',
        limit: 0,
        searchString: 'test',
      });
    });

    it('should use cached search results and not fetch again', async () => {
      await loadEntity('http://localhost/entity/shared1?searchTerm=query');

      await loadEntity('http://localhost/entity/shared1?searchTerm=query');

      expect(search.snippets).toHaveBeenCalledTimes(1);
    });

    it('should fetch if the search changes and cache repeated searches', async () => {
      await loadEntity('http://localhost/entity/shared1?searchTerm=query1');

      await loadEntity('http://localhost/entity/shared1?searchTerm=query2');

      await loadEntity('http://localhost/entity/shared1?searchTerm=query1');

      expect(search.snippets).toHaveBeenCalledTimes(2);
    });
  });

  describe('Cache invalidation', () => {
    it('should fetch again after cache is invalidated', async () => {
      await loadEntity('http://localhost/entity/shared1');

      entityLoaderCache.invalidateEntity('shared1');

      await loadEntity('http://localhost/entity/shared1');

      expect(mockCompositionUseCase.composeEntity).toHaveBeenCalledTimes(2);
    });
  });
});
