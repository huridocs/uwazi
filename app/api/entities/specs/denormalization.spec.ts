import db from 'api/utils/testing_db';
import entities from 'api/entities';

import { ObjectIdSchema } from 'shared/types/commonTypes';

function getIdCache() {
  const map = new Map<string, ObjectIdSchema>();

  return function setAndGet(key: string) {
    if (!map.has(key)) map.set(key, db.id());

    return map.get(key);
  };
}

describe('getIdCache', () => {
  it('should create a new id', () => {
    const ids = getIdCache();

    expect(ids('key')).toBeDefined();
  });

  it('should create a different ids', () => {
    const ids = getIdCache();

    expect(ids('key1')).not.toEqual(ids('key2'));
  });

  it('should cache ids', () => {
    const ids = getIdCache();

    expect(ids('key')).toEqual(ids('key'));
  });
});

const load = async (data: any) => db.setupFixturesAndContext(data);

afterAll(async () => db.disconnect());

describe('Denormalizing relationships', () => {
  describe('When entities are of different templates', () => {
    const ids = getIdCache();

    const fixtures = {
      templates: [
        {
          _id: ids('A'),
          name: 'A',
          properties: [
            {
              type: 'relationship',
              name: 'relationship_property_a',
              relationType: ids('rel1'),
              content: ids('B'),
            },
          ],
        },
        {
          _id: ids('B'),
          name: 'B',
          properties: [],
        },
      ],
      entities: [
        {
          _id: ids('A1'),
          sharedId: 'A1',
          type: 'entity',
          template: ids('A'),
          language: 'en',
          title: 'A1',
          metadata: {
            relationship_property_a: [{ icon: null, label: 'B1', type: 'entity', value: 'B1' }],
          },
        },
        {
          _id: ids('B1'),
          sharedId: 'B1',
          type: 'entity',
          template: ids('B'),
          language: 'en',
          title: 'B1',
          metadata: {},
        },
      ],
      connections: [
        { entity: 'A1', template: null, hub: ids('hub1'), entityData: {} },
        { entity: 'B1', template: ids('rel1'), hub: ids('hub1'), entityData: {} },
      ],
      settings: [{ _id: db.id(), languages: [{ key: 'en', default: true }] }],
    };

    it('should create a connection if setting relationship property', async () => {
      await load(fixtures);

      await entities.save(
        {
          ...fixtures.entities[1],
          title: 'New title',
        },
        { language: 'en', user: {} },
        true
      );

      const relatedEntity = await entities.getById('A1', 'en');
      console.log(JSON.stringify(relatedEntity, null, 2));

      expect(relatedEntity!.metadata!.relationship_property_a![0].label).toBe('New title');
    });
  });
});
