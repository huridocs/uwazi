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
      mainDocument: { _id: 'doc1', filename: 'test.pdf' },
    };

    mockCompositionUseCase = { composeEntity: jest.fn() };
    (container.getEntityCompositionUseCase as jest.Mock).mockResolvedValue(mockCompositionUseCase);

    mockCompositionUseCase.composeEntity.mockResolvedValue({ success: true, entity: mockEntity });
  });

  const createRequest = (url: string) => ({ url }) as Request;

  const loadEntity = (url: string) =>
    entityLoader()({ params: { sharedId: 'shared1' }, request: createRequest(url), context: '' });

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
      jest.spyOn(files, 'getPagePlaintext');

      await loadEntity('http://localhost/entity/shared1?page=1');

      expect(files.getPagePlaintext).toHaveBeenCalledWith('doc1', 1);
    });

    it('should use cached plaintext and not fetch again', async () => {
      jest.spyOn(files, 'getPagePlaintext');

      await loadEntity('http://localhost/entity/shared1?page=1');

      await loadEntity('http://localhost/entity/shared1?page=1');

      expect(files.getPagePlaintext).toHaveBeenCalledTimes(1);
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

    it('should fetch if the search changes', async () => {
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
