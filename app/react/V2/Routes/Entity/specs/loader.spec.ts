/**
 * @jest-environment jsdom
 */
import * as entityApi from '#V2/api/entities/index.js';
import * as files from '#V2/api/files/index.js';
import * as search from '#V2/api/search/index.js';
import { Entity } from '#V2/api/entities/types.js';
import { settingsAtom } from '#V2/atoms/settingsAtom.js';
import { getStore } from '#shared/atomStore/index.js';
import type { LoaderFunctionArgs } from 'react-router';
import { entityLoader } from '../loader.js';
import { entityLoaderCache } from '../EntityLoaderCache.js';

jest.mock('#V2/api/entities/index.js');
jest.mock('#V2/api/files/index.js');
jest.mock('#V2/api/search/index.js');

describe('Entity loader with cache integration', () => {
  let mockEntity: Partial<Entity>;

  beforeEach(() => {
    jest.clearAllMocks();
    entityLoaderCache.invalidateAll();

    mockEntity = {
      _id: 'entity1',
      sharedId: 'shared1',
      title: 'Test Entity',
      language: 'en',
      template: 'template1',
      creationDate: 1,
      user: 'user1',
      documents: [{ _id: 'doc1', filename: 'test.pdf' }],
      relations: [],
    };

    jest.spyOn(entityApi, 'getBySharedId').mockResolvedValue([[mockEntity as Entity]]);
    jest.spyOn(files, 'getPagePlaintext').mockResolvedValue('plaintext content');
    getStore().set(settingsAtom, {
      languages: [
        { key: 'en', label: 'English', default: true },
        { key: 'es', label: 'Spanish' },
      ],
    } as any);
  });

  const loadEntity = (url: string, lang?: string) => {
    const fullUrl = new URL(url);
    const pathParts = fullUrl.pathname.split('/');
    const sharedId = pathParts[pathParts.length - 1];

    return entityLoader()({
      params: { sharedId, ...(lang ? { lang } : {}) },
      request: new Request(fullUrl),
      unstable_pattern: '',
      context: {},
    } as unknown as LoaderFunctionArgs);
  };

  describe('Entity loading', () => {
    it('should fetch entity when not cached', async () => {
      await loadEntity('http://localhost/entity/shared1');

      expect(entityApi.getBySharedId).toHaveBeenCalledTimes(1);
    });

    it('should use cached entity and not fetch again', async () => {
      await loadEntity('http://localhost/entity/shared1');
      await loadEntity('http://localhost/entity/shared1');

      expect(entityApi.getBySharedId).toHaveBeenCalledTimes(1);
    });

    it('should refetch when cache only has a partial entity', async () => {
      const partialEntity = { ...(mockEntity as Entity) };
      delete (partialEntity as { relations?: Entity['relations'] }).relations;
      entityLoaderCache.setEntity('shared1', 'en', partialEntity);

      await loadEntity('http://localhost/entity/shared1', 'en');

      expect(entityApi.getBySharedId).toHaveBeenCalledTimes(1);
      expect(
        entityLoaderCache.getEntity('shared1', 'en', { requireRelationships: true })?.relations
      ).toEqual([]);
    });
  });

  describe('Plaintext loading', () => {
    it('should fetch plaintext when not cached', async () => {
      await loadEntity('http://localhost/entity/shared1?page=1&raw=true');

      expect(files.getPagePlaintext).toHaveBeenCalledWith('doc1', 1, undefined);
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
    beforeEach(() => {
      jest.spyOn(search, 'snippets').mockResolvedValue('data' as any);
    });

    it('should fetch search results when not cached', async () => {
      await loadEntity('http://localhost/entity/shared1?searchTerm=test');

      expect(search.snippets).toHaveBeenCalledWith(
        {
          sharedId: 'shared1',
          limit: 0,
          searchString: 'test',
        },
        undefined
      );
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

  describe('Main document loading', () => {
    it('should include mainDocument in the loader response', async () => {
      const result = (await loadEntity('http://localhost/entity/shared1')) as any;

      expect(result.mainDocument).toEqual(mockEntity.documents![0]);
    });

    it('should cache mainDocument and not recompute on subsequent loads', async () => {
      const getMainDocumentSpy = jest.spyOn(entityLoaderCache, 'setMainDocument');

      await loadEntity('http://localhost/entity/shared1');
      await loadEntity('http://localhost/entity/shared1');

      // setMainDocument is only called once — on first load; subsequent loads use the cache
      expect(getMainDocumentSpy).toHaveBeenCalledTimes(1);
    });

    it('should recompute mainDocument after cache invalidation', async () => {
      const setMainDocumentSpy = jest.spyOn(entityLoaderCache, 'setMainDocument');

      await loadEntity('http://localhost/entity/shared1');
      entityLoaderCache.invalidateEntity('shared1');
      await loadEntity('http://localhost/entity/shared1');

      expect(setMainDocumentSpy).toHaveBeenCalledTimes(2);
    });

    it('should use default language document when locale does not match', async () => {
      mockEntity.documents = [
        { _id: 'doc-es', filename: 'es.pdf', language: 'spa' },
        { _id: 'doc-en', filename: 'en.pdf', language: 'eng' },
      ];

      const result = (await loadEntity('http://localhost/entity/shared1', 'fr')) as any;

      expect(result.mainDocument).toEqual(mockEntity.documents[1]);
    });
  });

  describe('Cache invalidation', () => {
    it('should fetch again after cache is invalidated', async () => {
      await loadEntity('http://localhost/entity/shared1');

      entityLoaderCache.invalidateEntity('shared1');

      await loadEntity('http://localhost/entity/shared1');

      expect(entityApi.getBySharedId).toHaveBeenCalledTimes(2);
    });
  });
});
