/**
 * @jest-environment jsdom
 */
import type { LoaderFunctionArgs } from 'react-router';
import { ApiError } from '#shared/apiClient/index.js';
import * as files from '#V2/api/files/index.js';
import { Entity } from '#V2/api/entities/types.js';
import { settingsAtom } from '#V2/atoms/settingsAtom.js';
import { getStore } from '#shared/atomStore/index.js';
import { createTestServices } from '#V2/testing/createTestServices.js';
import { createEntityLoader } from '../loader.js';
import { entityLoaderCache } from '../EntityLoaderCache.js';

jest.mock('#V2/api/files/index.js');

describe('Entity loader with cache integration', () => {
  let mockEntity: Partial<Entity>;
  let getBySharedId: jest.Mock;

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

    getBySharedId = jest.fn().mockResolvedValue([[mockEntity as Entity]]);
    jest.spyOn(files, 'getDocumentPlaintext').mockResolvedValue('plaintext content');
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
    const loader = createEntityLoader(createTestServices({ entities: { getBySharedId } }))();

    return loader({
      params: { sharedId, ...(lang ? { lang } : {}) },
      request: new Request(fullUrl),
      unstable_pattern: '',
      context: {},
    } as unknown as LoaderFunctionArgs);
  };

  describe('Entity loading', () => {
    it('should fetch entity when not cached', async () => {
      await loadEntity('http://localhost/entity/shared1');

      expect(getBySharedId).toHaveBeenCalledTimes(1);
    });

    it('should use cached entity and not fetch again', async () => {
      await loadEntity('http://localhost/entity/shared1');
      await loadEntity('http://localhost/entity/shared1');

      expect(getBySharedId).toHaveBeenCalledTimes(1);
    });

    it('should refetch when cache only has a partial entity', async () => {
      const partialEntity = { ...(mockEntity as Entity) };
      delete (partialEntity as { relations?: Entity['relations'] }).relations;
      entityLoaderCache.setEntity('shared1', 'en', partialEntity);

      await loadEntity('http://localhost/entity/shared1', 'en');

      expect(getBySharedId).toHaveBeenCalledTimes(1);
      expect(
        entityLoaderCache.getEntity('shared1', 'en', { requireRelationships: true })?.relations
      ).toEqual([]);
    });
  });

  describe('Plaintext loading', () => {
    it('should fetch full document plaintext when not cached', async () => {
      await loadEntity('http://localhost/entity/shared1#raw=true');

      expect(files.getDocumentPlaintext).toHaveBeenCalledWith('doc1', undefined);
    });

    it('should use cached plaintext and not fetch again', async () => {
      await loadEntity('http://localhost/entity/shared1#raw=true');
      await loadEntity('http://localhost/entity/shared1#raw=true');

      expect(files.getDocumentPlaintext).toHaveBeenCalledTimes(1);
    });

    it('should reuse full-document cache across repeated loads', async () => {
      await loadEntity('http://localhost/entity/shared1#raw=true');
      await loadEntity('http://localhost/entity/shared1#raw=true');
      await loadEntity('http://localhost/entity/shared1#raw=true');

      expect(files.getDocumentPlaintext).toHaveBeenCalledTimes(1);
    });

    it('should not fetch if the view mode is not set for plaintext', async () => {
      await loadEntity('http://localhost/entity/shared1');
      await loadEntity('http://localhost/entity/shared1');

      expect(files.getDocumentPlaintext).not.toHaveBeenCalled();
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
    it('should throw when entity fetch returns an API error', async () => {
      getBySharedId.mockResolvedValue([
        undefined,
        new ApiError('Not found', { kind: 'http', status: 404, detail: 'Entity missing' }),
      ]);

      await expect(loadEntity('http://localhost/entity/shared1')).rejects.toMatchObject({
        status: 404,
        message: 'Entity missing',
      });
    });

    it('should throw when entity fetch returns no rows', async () => {
      getBySharedId.mockResolvedValue([[]]);

      await expect(loadEntity('http://localhost/entity/shared1')).rejects.toMatchObject({
        status: 404,
        message: 'Entity shared1 not found',
      });
    });

    it('should fetch again after cache is invalidated', async () => {
      await loadEntity('http://localhost/entity/shared1');

      entityLoaderCache.invalidateEntity('shared1');

      await loadEntity('http://localhost/entity/shared1');

      expect(getBySharedId).toHaveBeenCalledTimes(2);
    });
  });
});
