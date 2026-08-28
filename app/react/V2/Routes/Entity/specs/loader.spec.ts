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
  let loadSummary: jest.Mock;
  let loadAnchors: jest.Mock;
  let loadResolved: jest.Mock;

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
      documents: [{ _id: 'doc1', filename: 'test.pdf', status: 'ready' }],
      relations: [],
    };

    getBySharedId = jest.fn().mockResolvedValue([[mockEntity as Entity]]);
    loadSummary = jest.fn().mockResolvedValue([[]]);
    loadAnchors = jest.fn().mockResolvedValue([[]]);
    loadResolved = jest.fn();
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
    const loader = createEntityLoader(
      createTestServices({
        entities: { getBySharedId },
        relationshipsQuery: { loadSummary, loadAnchors, loadResolved },
      })
    )();

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

    it('should fetch entity without relationships and reuse the cache', async () => {
      await loadEntity('http://localhost/entity/shared1', 'en');

      expect(getBySharedId).toHaveBeenCalledWith('shared1', {
        language: 'en',
        omitRelationships: true,
        headers: undefined,
      });

      await loadEntity('http://localhost/entity/shared1', 'en');
      expect(getBySharedId).toHaveBeenCalledTimes(1);
    });
  });

  describe('Relationship query loading', () => {
    it('loads summary and anchors for document first paint and never resolved', async () => {
      const selfHub = {
        _id: 'c1',
        hub: 'h1',
        entity: 'shared1',
        template: null,
        entityData: { title: 'Test Entity', template: 'template1' },
      };
      const selectionRectangles = [{ top: 1, left: 2, width: 3, height: 4, page: '1' }];
      loadSummary.mockResolvedValue([[selfHub]]);
      loadAnchors.mockResolvedValue([[{ _id: 'c1', reference: { selectionRectangles } }]]);

      const result = await loadEntity('http://localhost/entity/shared1', 'en');

      expect(loadSummary).toHaveBeenCalledWith('shared1', {
        language: 'en',
        headers: undefined,
      });
      expect(loadAnchors).toHaveBeenCalledWith('shared1', {
        language: 'en',
        fileId: 'doc1',
        headers: undefined,
      });
      expect(loadResolved).not.toHaveBeenCalled();
      expect(result).toEqual(
        expect.objectContaining({
          relationshipQuery: {
            language: 'en',
            sharedId: 'shared1',
            fileId: 'doc1',
            hubRows: [{ ...selfHub, reference: { selectionRectangles } }],
            anchorsLoaded: true,
          },
        })
      );
    });

    it('loads anchors when relationships main shows the document side rail', async () => {
      await loadEntity('http://localhost/entity/shared1?m=relationships', 'en');

      expect(loadSummary).toHaveBeenCalled();
      expect(loadAnchors).toHaveBeenCalled();
      expect(loadResolved).not.toHaveBeenCalled();
    });

    it('skips anchors when relationships main has no document rail', async () => {
      await loadEntity('http://localhost/entity/shared1?m=relationships#s=metadata', 'en');

      expect(loadSummary).toHaveBeenCalled();
      expect(loadAnchors).not.toHaveBeenCalled();
    });

    it('skips anchors for the relationships side panel without a document rail', async () => {
      await loadEntity('http://localhost/entity/shared1?m=metadata#s=relationships', 'en');

      expect(loadSummary).toHaveBeenCalled();
      expect(loadAnchors).not.toHaveBeenCalled();
    });

    it('skips anchors for files first paint', async () => {
      await loadEntity('http://localhost/entity/shared1?m=files', 'en');

      expect(loadSummary).toHaveBeenCalled();
      expect(loadAnchors).not.toHaveBeenCalled();
    });

    it('skips anchors for metadata-only first paint', async () => {
      const result = await loadEntity('http://localhost/entity/shared1?m=metadata', 'en');

      expect(loadSummary).toHaveBeenCalledWith('shared1', {
        language: 'en',
        headers: undefined,
      });
      expect(loadAnchors).not.toHaveBeenCalled();
      expect(loadResolved).not.toHaveBeenCalled();
      expect(result).toEqual(
        expect.objectContaining({
          relationshipQuery: expect.objectContaining({
            fileId: 'doc1',
            hubRows: [],
            anchorsLoaded: false,
          }),
        })
      );
    });

    it('skips anchors for raw document view', async () => {
      await loadEntity('http://localhost/entity/shared1#raw=true', 'en');

      expect(loadSummary).toHaveBeenCalled();
      expect(loadAnchors).not.toHaveBeenCalled();
      expect(loadResolved).not.toHaveBeenCalled();
    });

    it('skips anchors when the entity has no file', async () => {
      mockEntity.documents = [];
      const result = await loadEntity('http://localhost/entity/shared1', 'en');

      expect(loadSummary).toHaveBeenCalled();
      expect(loadAnchors).not.toHaveBeenCalled();
      expect(result).toEqual(
        expect.objectContaining({
          relationshipQuery: {
            language: 'en',
            sharedId: 'shared1',
            hubRows: [],
            anchorsLoaded: false,
          },
        })
      );
    });

    it('returns empty relationship rows when the graph is missing', async () => {
      loadSummary.mockResolvedValue([[]]);
      loadAnchors.mockResolvedValue([[]]);

      const result = await loadEntity('http://localhost/entity/shared1', 'en');

      expect(result).toEqual(
        expect.objectContaining({
          relationshipQuery: expect.objectContaining({ hubRows: [], anchorsLoaded: true }),
        })
      );
    });

    it('reuses cached relationship seeds and refetches after invalidate', async () => {
      await loadEntity('http://localhost/entity/shared1', 'en');
      expect(loadSummary).toHaveBeenCalledTimes(1);
      expect(loadAnchors).toHaveBeenCalledTimes(1);

      await loadEntity('http://localhost/entity/shared1', 'en');
      expect(loadSummary).toHaveBeenCalledTimes(1);
      expect(loadAnchors).toHaveBeenCalledTimes(1);

      entityLoaderCache.invalidateEntity('shared1');
      await loadEntity('http://localhost/entity/shared1', 'en');

      expect(loadSummary).toHaveBeenCalledTimes(2);
      expect(loadAnchors).toHaveBeenCalledTimes(2);
    });

    it('upgrades a summary-only cache when anchors are needed', async () => {
      await loadEntity('http://localhost/entity/shared1?m=metadata', 'en');
      expect(loadSummary).toHaveBeenCalledTimes(1);
      expect(loadAnchors).not.toHaveBeenCalled();

      await loadEntity('http://localhost/entity/shared1', 'en');
      expect(loadSummary).toHaveBeenCalledTimes(2);
      expect(loadAnchors).toHaveBeenCalledTimes(1);

      await loadEntity('http://localhost/entity/shared1?m=files', 'en');
      expect(loadSummary).toHaveBeenCalledTimes(2);
      expect(loadAnchors).toHaveBeenCalledTimes(1);
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

    it('should recache mainDocument when originalname changes', async () => {
      const setMainDocumentSpy = jest.spyOn(entityLoaderCache, 'setMainDocument');

      await loadEntity('http://localhost/entity/shared1');
      entityLoaderCache.invalidateEntity('shared1');
      mockEntity.documents = [
        { ...mockEntity.documents![0], originalname: 'renamed.pdf', status: 'ready' },
      ];
      await loadEntity('http://localhost/entity/shared1');

      expect(setMainDocumentSpy).toHaveBeenLastCalledWith(
        'shared1',
        '',
        expect.objectContaining({ originalname: 'renamed.pdf' })
      );
    });

    it('should use default language document when locale does not match', async () => {
      mockEntity.documents = [
        { _id: 'doc-es', filename: 'es.pdf', language: 'spa', status: 'ready' },
        { _id: 'doc-en', filename: 'en.pdf', language: 'eng', status: 'ready' },
      ];

      const result = (await loadEntity('http://localhost/entity/shared1', 'fr')) as any;

      expect(result.mainDocument).toEqual(mockEntity.documents[1]);
    });

    it('should ignore non-ready documents for mainDocument and plaintext', async () => {
      mockEntity.documents = [
        { _id: 'doc-processing', filename: 'processing.pdf', status: 'processing' },
      ];

      const result = (await loadEntity('http://localhost/entity/shared1#raw=true')) as any;

      expect(result.mainDocument).toBeUndefined();
      expect(files.getDocumentPlaintext).not.toHaveBeenCalled();
    });
  });

  describe('Cache invalidation', () => {
    it('should throw when entity fetch returns an API error', async () => {
      getBySharedId.mockResolvedValue([
        undefined,
        new ApiError('Not found', { kind: 'http', status: 404, detail: 'Entity missing' }),
      ]);

      await expect(loadEntity('http://localhost/entity/shared1')).rejects.toMatchObject({
        type: 'DataWithResponseInit',
        data: { message: 'Entity missing' },
        init: { status: 404 },
      });
    });

    it('should throw when entity fetch returns no rows', async () => {
      getBySharedId.mockResolvedValue([[]]);

      await expect(loadEntity('http://localhost/entity/shared1')).rejects.toMatchObject({
        type: 'DataWithResponseInit',
        data: { message: 'Entity shared1 not found' },
        init: { status: 404 },
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
