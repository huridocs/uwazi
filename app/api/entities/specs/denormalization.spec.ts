import db, { DBFixture } from 'api/utils/testing_db';
import entities from 'api/entities';

import { ObjectId } from 'mongodb';

function getIdMapper() {
  const map = new Map<string, ObjectId>();

  return function setAndGet(key: string) {
    if (!map.has(key)) map.set(key, db.id() as ObjectId);

    return map.get(key)!;
  };
}

describe('getIdCache', () => {
  it('should create a new id', () => {
    const ids = getIdMapper();

    expect(ids('key')).toBeDefined();
  });

  it('should create a different ids', () => {
    const ids = getIdMapper();

    expect(ids('key1')).not.toEqual(ids('key2'));
  });

  it('should cache ids', () => {
    const ids = getIdMapper();

    expect(ids('key')).toEqual(ids('key'));
  });
});

const load = async (data: DBFixture) => db.setupFixturesAndContext(data);

afterAll(async () => db.disconnect());

describe('Denormalizing relationships', () => {
  describe('When entities are of different templates', () => {
    const ids = getIdMapper();

    it('should update the title in related entities', async () => {
      const fixtures: DBFixture = {
        templates: [
          {
            _id: ids('A'),
            name: 'A',
            properties: [
              {
                type: 'relationship',
                name: 'relationship_property_a',
                relationType: ids('rel1'),
                content: ids('B').toString(),
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
              relationship_property_a: [
                { icon: null, label: 'B1', type: 'entity', value: 'B1' },
                { icon: null, label: 'B2', type: 'entity', value: 'B2' },
              ],
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
          {
            _id: ids('B2'),
            sharedId: 'B2',
            type: 'entity',
            template: ids('B'),
            language: 'en',
            title: 'B2',
            metadata: {},
          },
        ],
        settings: [{ _id: db.id(), languages: [{ key: 'en', default: true }] }],
      };
      await load(fixtures);

      await entities.save(
        {
          ...fixtures.entities![1],
          title: 'New title',
        },
        { language: 'en', user: {} },
        true
      );

      await entities.save(
        {
          ...fixtures.entities![2],
          title: 'New title 2',
        },
        { language: 'en', user: {} },
        true
      );

      const relatedEntity = await entities.getById('A1', 'en');
      expect(relatedEntity!.metadata!.relationship_property_a![0].label).toBe('New title');
      expect(relatedEntity!.metadata!.relationship_property_a![1].label).toBe('New title 2');
    });
    it('should update inherited labels from related entities', async () => {
      const fixtures: DBFixture = {
        templates: [
          {
            _id: ids('A'),
            name: 'A',
            properties: [
              {
                type: 'relationship_inherited',
                name: 'relationship_property_inherited',
                relationType: ids('rel1'),
                content: ids('B').toString(),
                inherit: {
                  type: 'text',
                  property: ids('idB').toString(),
                },
              },
            ],
          },
          {
            _id: ids('B'),
            name: 'B',
            properties: [
              {
                id: ids('idB').toString(),
                type: 'text',
                name: 'text',
              },
            ],
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
              relationship_property_inherited: [
                {
                  icon: null,
                  label: 'B1',
                  type: 'entity',
                  value: 'B1',
                  inheritedValue: [{ value: 'text1' }],
                },
                {
                  icon: null,
                  label: 'B2',
                  type: 'entity',
                  value: 'B2',
                  inheritedValue: [{ value: 'text2' }],
                },
              ],
            },
          },
          {
            _id: ids('B1'),
            sharedId: 'B1',
            type: 'entity',
            template: ids('B'),
            language: 'en',
            title: 'B1',
            metadata: { text: [{ value: 'text1' }] },
          },
          {
            _id: ids('B2'),
            sharedId: 'B2',
            type: 'entity',
            template: ids('B'),
            language: 'en',
            title: 'B2',
            metadata: { text: [{ value: 'text2' }] },
          },
        ],
        settings: [{ _id: db.id(), languages: [{ key: 'en', default: true }] }],
      };
      await load(fixtures);

      await entities.save(
        {
          ...fixtures.entities![1],
          metadata: {
            text: [{ value: 'text 1 changed' }],
          },
        },
        { language: 'en', user: {} },
        true
      );

      await entities.save(
        {
          ...fixtures.entities![2],
          metadata: {
            text: [{ value: 'text 2 changed' }],
          },
        },
        { language: 'en', user: {} },
        true
      );

      const relatedEntity = await entities.getById('A1', 'en');
      expect(
        relatedEntity!.metadata!.relationship_property_inherited![0].inheritedValue![0].value
      ).toBe('text 1 changed');
      expect(
        relatedEntity!.metadata!.relationship_property_inherited![1].inheritedValue![0].value
      ).toBe('text 2 changed');
    });
  });
});
