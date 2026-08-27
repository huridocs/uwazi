/**
 * @jest-environment jsdom
 */
import { Entity } from '#V2/api/entities/types.js';
import type { RelationshipQueryPayload } from '#V2/api/relationships/types.js';
import { entityLoaderCache } from '../EntityLoaderCache.js';

const sharedId = 'shared1';
const language = 'en';

const baseEntity: Entity = {
  _id: 'entity1',
  sharedId,
  language,
  title: 'Test Entity',
  template: 'template1',
  creationDate: 1,
  user: 'user1',
  documents: [],
  attachments: [],
};

const summarySeed: RelationshipQueryPayload = {
  language,
  sharedId,
  fileId: 'doc1',
  hubRows: [],
  anchorsLoaded: false,
};

const anchorsSeed: RelationshipQueryPayload = {
  ...summarySeed,
  anchorsLoaded: true,
};

describe('EntityLoaderCache entity entries', () => {
  beforeEach(() => {
    entityLoaderCache.invalidateAll();
  });

  it('returns partial entries for preview reads', () => {
    entityLoaderCache.setEntity(sharedId, language, { ...baseEntity, title: 'Partial' });

    expect(entityLoaderCache.getEntity(sharedId, language)?.title).toBe('Partial');
    expect(entityLoaderCache.getEntity(sharedId, language, { requireRelationships: true })).toBe(
      undefined
    );
  });

  it('stores full entities for loader reads', () => {
    entityLoaderCache.setEntity(sharedId, language, { ...baseEntity, relations: [] });

    expect(
      entityLoaderCache.getEntity(sharedId, language, { requireRelationships: true })?.relations
    ).toEqual([]);
  });

  it('replaces partial entries when a full entity is stored', () => {
    entityLoaderCache.setEntity(sharedId, language, { ...baseEntity, title: 'Partial' });
    entityLoaderCache.setEntity(sharedId, language, {
      ...baseEntity,
      title: 'Full',
      relations: [],
    });

    const cached = entityLoaderCache.getEntity(sharedId, language, { requireRelationships: true });
    expect(cached?.title).toBe('Full');
    expect(cached?.relations).toEqual([]);
  });

  it('merges partial updates without dropping existing relations', () => {
    entityLoaderCache.setEntity(sharedId, language, {
      ...baseEntity,
      title: 'Full',
      relations: [{ entity: 'other' }],
    });
    entityLoaderCache.setEntity(sharedId, language, { ...baseEntity, title: 'Updated metadata' });

    const cached = entityLoaderCache.getEntity(sharedId, language, { requireRelationships: true });
    expect(cached?.title).toBe('Updated metadata');
    expect(cached?.relations).toEqual([{ entity: 'other' }]);
  });

  it('does not serve relationships after invalidate until a full entity is stored', () => {
    entityLoaderCache.setEntity(sharedId, language, {
      ...baseEntity,
      relations: [{ entity: 'old' }],
    });
    entityLoaderCache.invalidateEntity(sharedId);

    expect(entityLoaderCache.isRefetchPending(sharedId)).toBe(true);
    expect(entityLoaderCache.getEntity(sharedId, language, { requireRelationships: true })).toBe(
      undefined
    );

    entityLoaderCache.setEntity(sharedId, language, {
      ...baseEntity,
      title: 'Fresh',
      relations: [{ entity: 'new' }],
    });

    expect(entityLoaderCache.isRefetchPending(sharedId)).toBe(false);
    expect(
      entityLoaderCache.getEntity(sharedId, language, { requireRelationships: true })?.relations
    ).toEqual([{ entity: 'new' }]);
  });
});

describe('EntityLoaderCache relationship query seeds', () => {
  beforeEach(() => {
    entityLoaderCache.invalidateAll();
  });

  it('serves cached seeds and skips summary-only when anchors are required', () => {
    entityLoaderCache.setRelationshipQuery(sharedId, language, 'doc1', summarySeed);

    expect(entityLoaderCache.getRelationshipQuery(sharedId, language, 'doc1')).toEqual(summarySeed);
    expect(
      entityLoaderCache.getRelationshipQuery(sharedId, language, 'doc1', { requireAnchors: true })
    ).toBeUndefined();

    entityLoaderCache.setRelationshipQuery(sharedId, language, 'doc1', anchorsSeed);
    expect(
      entityLoaderCache.getRelationshipQuery(sharedId, language, 'doc1', { requireAnchors: true })
    ).toEqual(anchorsSeed);
  });

  it('does not downgrade an anchors seed to summary-only', () => {
    entityLoaderCache.setRelationshipQuery(sharedId, language, 'doc1', anchorsSeed);
    entityLoaderCache.setRelationshipQuery(sharedId, language, 'doc1', summarySeed);

    expect(
      entityLoaderCache.getRelationshipQuery(sharedId, language, 'doc1', { requireAnchors: true })
    ).toEqual(anchorsSeed);
  });

  it('clears relationship seeds on invalidateEntity and invalidateAll', () => {
    entityLoaderCache.setRelationshipQuery(sharedId, language, 'doc1', anchorsSeed);
    entityLoaderCache.invalidateEntity(sharedId);

    expect(entityLoaderCache.getRelationshipQuery(sharedId, language, 'doc1')).toBeUndefined();

    entityLoaderCache.setRelationshipQuery(sharedId, language, 'doc1', anchorsSeed);
    entityLoaderCache.invalidateAll();

    expect(entityLoaderCache.getRelationshipQuery(sharedId, language, 'doc1')).toBeUndefined();
  });
});
