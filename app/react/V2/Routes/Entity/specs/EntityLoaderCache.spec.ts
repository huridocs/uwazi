/**
 * @jest-environment jsdom
 */
import { Entity } from '#V2/api/entities/types.js';
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
});
