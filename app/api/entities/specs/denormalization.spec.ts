import db, { DBFixture } from 'api/utils/testing_db';
import entities from 'api/entities';

import { ObjectId } from 'mongodb';
import { EntitySchema } from 'shared/types/entityType';
import { PropertySchema } from 'shared/types/commonTypes';
import thesauris from 'api/thesauri';

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

const load = async (data: DBFixture) =>
  db.setupFixturesAndContext({
    ...data,
    settings: [{ _id: db.id(), languages: [{ key: 'en', default: true }] }],
    translations: [{ locale: 'en', contexts: [] }],
  });

afterAll(async () => db.disconnect());

describe('Denormalize relationships', () => {
  const ids = getIdMapper();

  const entity = (id: string, props = {}): EntitySchema => ({
    _id: ids(id),
    sharedId: id,
    language: 'en',
    title: id,
    ...props,
  });

  const relationshipProp = (name: string, relation: string, props = {}): PropertySchema => ({
    id: ids(name).toString(),
    label: name,
    name,
    type: 'relationship',
    relationType: ids('rel1').toString(),
    content: ids(relation).toString(),
    ...props,
  });

  const property = (
    name: string,
    type: PropertySchema['type'] = 'text',
    props = {}
  ): PropertySchema => ({
    id: name,
    label: name,
    name,
    type,
    ...props,
  });

  const metadataValue = (value: string) => ({ value, label: value });

  const modifyEntity = async (id: string, entityData: EntitySchema) => {
    await entities.save({ ...entity(id), ...entityData }, { language: 'en', user: {} }, true);
  };

  describe('title and inherited text', () => {
    it('should update title and text property on related entities denormalized properties', async () => {
      const fixtures: DBFixture = {
        templates: [
          {
            _id: ids('templateA'),
            properties: [
              relationshipProp('relationship', 'templateB', {
                inherit: { type: 'text', property: ids('text').toString() },
              }),
            ],
          },
          { _id: ids('templateB'), properties: [property('text')] },
        ],
        entities: [
          entity('A1', {
            template: ids('templateA'),
            metadata: {
              relationship: [metadataValue('B1'), metadataValue('B2')],
            },
          }),
          entity('B1', { template: ids('templateB') }),
          entity('B2', { template: ids('templateB') }),
        ],
      };

      await load(fixtures);
      await modifyEntity('B1', {
        title: 'new Title',
        metadata: { text: [{ value: 'text 1 changed' }] },
      });
      await modifyEntity('B2', {
        title: 'new Title 2',
        metadata: { text: [{ value: 'text 2 changed' }] },
      });

      const relatedEntity = await entities.getById('A1', 'en');
      expect(relatedEntity?.metadata).toEqual({
        relationship: [
          expect.objectContaining({
            label: 'new Title',
            inheritedValue: [{ value: 'text 1 changed' }],
          }),
          expect.objectContaining({
            label: 'new Title 2',
            inheritedValue: [{ value: 'text 2 changed' }],
          }),
        ],
      });
    });
  });

  describe('inherited select/multiselect (thesauri)', () => {
    beforeEach(async () => {
      const fixtures: DBFixture = {
        templates: [
          {
            _id: ids('templateA'),
            properties: [
              relationshipProp('relationship', 'templateB', {
                inherit: { type: 'multiselect', property: 'multiselect' },
              }),
            ],
          },
          {
            _id: ids('templateB'),
            properties: [
              property('multiselect', 'multiselect', {
                content: ids('thesauri').toString(),
              }),
            ],
          },
        ],
        dictionaries: [
          {
            name: 'thesauri',
            _id: ids('thesauri'),
            values: [
              { _id: ids('T1'), id: 'T1', label: 'T1' },
              { _id: ids('T2'), id: 'T2', label: 'T2' },
              { _id: ids('T3'), id: 'T3', label: 'T3' },
            ],
          },
        ],
        entities: [
          entity('A1', {
            template: ids('templateA'),
            metadata: {
              relationship: [metadataValue('B1'), metadataValue('B2')],
            },
          }),
          entity('B1', {
            template: ids('templateB'),
            metadata: { multiselect: [metadataValue('T1')] },
          }),
          entity('B2', { template: ids('templateB') }),
        ],
      };
      await load(fixtures);
    });

    it('should update denormalized properties when thesauri selected changes', async () => {
      await modifyEntity('B1', {
        metadata: { multiselect: [{ value: 'T2' }, { value: 'T3' }] },
      });

      await modifyEntity('B2', {
        metadata: { multiselect: [{ value: 'T1' }] },
      });

      const relatedEntity = await entities.getById('A1', 'en');
      expect(relatedEntity?.metadata).toEqual({
        relationship: [
          expect.objectContaining({
            inheritedValue: [
              { value: 'T2', label: 'T2' },
              { value: 'T3', label: 'T3' },
            ],
          }),
          expect.objectContaining({
            inheritedValue: [{ value: 'T1', label: 'T1' }],
          }),
        ],
      });
    });

    it('should update denormalized properties when thesauri label changes', async () => {
      await modifyEntity('B1', {
        metadata: { multiselect: [{ value: 'T2' }, { value: 'T3' }] },
      });
      await modifyEntity('B2', {
        metadata: { multiselect: [{ value: 'T1' }] },
      });

      await thesauris.save({
        name: 'thesauri',
        _id: ids('thesauri'),
        values: [
          { _id: ids('T1'), id: 'T1', label: 'new 1' },
          { _id: ids('T2'), id: 'T2', label: 'T2' },
          { _id: ids('T3'), id: 'T3', label: 'new 3' },
        ],
      });

      const relatedEntity = await entities.getById('A1', 'en');
      expect(relatedEntity?.metadata).toEqual({
        relationship: [
          expect.objectContaining({
            inheritedValue: [
              { value: 'T2', label: 'T2' },
              { value: 'T3', label: 'new 3' },
            ],
          }),
          expect.objectContaining({
            inheritedValue: [{ value: 'T1', label: 'new 1' }],
          }),
        ],
      });
    });
  });

  describe('inherited relationship', () => {
    beforeEach(async () => {
      const fixtures: DBFixture = {
        templates: [
          {
            _id: ids('templateA'),
            properties: [
              relationshipProp('relationship', 'templateB', {
                inherit: { type: 'multiselect', property: 'multiselect' },
              }),
            ],
          },
          {
            _id: ids('templateB'),
            properties: [relationshipProp('relationshipB', 'templateC')],
          },
          {
            _id: ids('templateC'),
            properties: [],
          },
        ],
        entities: [
          entity('A1', {
            template: ids('templateA'),
            metadata: {
              relationship: [metadataValue('B1'), metadataValue('B2')],
            },
          }),
          entity('B1', {
            template: ids('templateB'),
            metadata: { relationshipB: [metadataValue('T1')] },
          }),
          entity('B2', { template: ids('templateB') }),

          entity('C1', { template: ids('templateC') }),
          entity('C2', { template: ids('templateC') }),
        ],
      };
      await load(fixtures);
    });

    it('should update denormalized properties when relationship selected changes', async () => {
      await modifyEntity('B1', {
        metadata: { relationshipB: [{ value: 'C1' }] },
      });

      await modifyEntity('B2', {
        metadata: { relationshipB: [{ value: 'C2' }] },
      });

      const relatedEntity = await entities.getById('A1', 'en');
      expect(relatedEntity?.metadata).toEqual({
        relationship: [
          expect.objectContaining({
            inheritedValue: [expect.objectContaining({ value: 'C1', label: 'C1' })],
          }),
          expect.objectContaining({
            inheritedValue: [expect.objectContaining({ value: 'C2', label: 'C2' })],
          }),
        ],
      });
    });

    it('should update denormalized properties when relationship inherited label changes', async () => {
      await modifyEntity('B1', { metadata: { relationshipB: [{ value: 'C1' }] } });
      await modifyEntity('B2', { metadata: { relationshipB: [{ value: 'C2' }] } });
      await modifyEntity('C1', { title: 'new C1' });
      await modifyEntity('C2', { title: 'new C2' });

      const relatedEntity = await entities.getById('A1', 'en');
      expect(relatedEntity?.metadata).toEqual({
        relationship: [
          expect.objectContaining({
            inheritedValue: [expect.objectContaining({ value: 'C1', label: 'new C1' })],
          }),
          expect.objectContaining({
            inheritedValue: [expect.objectContaining({ value: 'C2', label: 'new C2' })],
          }),
        ],
      });
    });
  });
});
