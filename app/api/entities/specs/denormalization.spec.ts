/* eslint-disable max-lines */
import db, { DBFixture } from 'api/utils/testing_db';
import entities from 'api/entities';

import { EntitySchema } from 'shared/types/entityType';
import thesauris from 'api/thesauri';
import { getFixturesFactory } from '../../utils/fixturesFactory';

const load = async (data: DBFixture) =>
  db.setupFixturesAndContext({
    ...data,
    settings: [{ _id: db.id(), languages: [{ key: 'en', default: true }] }],
    translations: [{ locale: 'en', contexts: [] }],
  });

afterAll(async () => db.disconnect());

describe('Denormalize relationships', () => {
  const factory = getFixturesFactory();

  const modifyEntity = async (id: string, entityData: EntitySchema) => {
    await entities.save(
      { ...factory.entity(id), ...entityData },
      { language: 'en', user: {} },
      true
    );
  };

  describe('title and basic property (text)', () => {
    it('should update title and text property on related entities denormalized properties', async () => {
      const fixtures: DBFixture = {
        templates: [
          {
            _id: factory.id('templateA'),
            properties: [
              factory.relationshipProp('relationship', 'templateB', 'rel1', {
                inherit: { type: 'text', property: factory.id('text').toString() },
              }),
              factory.relationshipProp('relationship2', 'templateC', 'rel1', {
                inherit: { type: 'text', property: factory.id('another_text').toString() },
              }),
            ],
          },
          { _id: factory.id('templateB'), properties: [factory.property('text')] },
          { _id: factory.id('templateC'), properties: [factory.property('another_text')] },
        ],
        entities: [
          factory.entity('A1', {
            template: factory.id('templateA'),
            metadata: {
              relationship: [factory.metadataValue('B1'), factory.metadataValue('B2')],
              relationship2: [factory.metadataValue('C1')],
            },
          }),
          factory.entity('B1', { template: factory.id('templateB') }),
          factory.entity('B2', { template: factory.id('templateB') }),
          factory.entity('C1', { template: factory.id('templateC') }),
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

      await modifyEntity('C1', {
        title: 'new Title C1',
        metadata: { another_text: [{ value: 'another text changed' }] },
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
        relationship2: [
          expect.objectContaining({
            label: 'new Title C1',
            inheritedValue: [{ value: 'another text changed' }],
          }),
        ],
      });
    });

    it('should update title and text property denormalized on related entities from 2 different templates', async () => {
      const fixtures: DBFixture = {
        templates: [
          {
            _id: factory.id('templateA'),
            properties: [factory.property('text')],
          },
          {
            _id: factory.id('templateB'),
            properties: [
              factory.relationshipProp('relationship_b', 'templateA', 'rel1', {
                inherit: { type: 'text', property: factory.id('text').toString() },
              }),
            ],
          },
          {
            _id: factory.id('templateC'),
            properties: [
              factory.relationshipProp('relationship_c', 'templateA', 'rel1', {
                inherit: { type: 'text', property: factory.id('text').toString() },
              }),
            ],
          },
        ],
        entities: [
          factory.entity('A1', {
            template: factory.id('templateA'),
          }),
          factory.entity('B1', {
            template: factory.id('templateB'),
            metadata: {
              relationship_b: [factory.metadataValue('A1')],
            },
          }),
          factory.entity('B2', {
            template: factory.id('templateB'),
            metadata: {
              relationship_b: [factory.metadataValue('A1')],
            },
          }),
          factory.entity('C1', {
            template: factory.id('templateC'),
            metadata: {
              relationship_c: [factory.metadataValue('A1')],
            },
          }),
        ],
      };

      await load(fixtures);

      await modifyEntity('A1', {
        title: 'new A1',
        metadata: { text: [{ value: 'text 1 changed' }] },
      });

      const [relatedB1, relatedB2, relatedC] = [
        await entities.getById('B1', 'en'),
        await entities.getById('B2', 'en'),
        await entities.getById('C1', 'en'),
      ];

      expect(relatedB1?.metadata).toEqual({
        relationship_b: [
          expect.objectContaining({
            label: 'new A1',
            inheritedValue: [{ value: 'text 1 changed' }],
          }),
        ],
      });

      expect(relatedB2?.metadata).toEqual({
        relationship_b: [
          expect.objectContaining({
            label: 'new A1',
            inheritedValue: [{ value: 'text 1 changed' }],
          }),
        ],
      });

      expect(relatedC?.metadata).toEqual({
        relationship_c: [
          expect.objectContaining({
            label: 'new A1',
            inheritedValue: [{ value: 'text 1 changed' }],
          }),
        ],
      });
    });

    it('should update title and 2 differente text properties denormalized on related entities', async () => {
      const fixtures: DBFixture = {
        templates: [
          {
            _id: factory.id('templateA'),
            properties: [factory.property('text1'), factory.property('text2')],
          },
          {
            _id: factory.id('templateB'),
            properties: [
              factory.relationshipProp('relationship_b', 'templateA', 'rel1', {
                inherit: { type: 'text', property: factory.id('text1').toString() },
              }),
            ],
          },
          {
            _id: factory.id('templateC'),
            properties: [
              factory.relationshipProp('relationship_c', 'templateA', 'rel1', {
                inherit: { type: 'text', property: factory.id('text2').toString() },
              }),
            ],
          },
        ],
        entities: [
          factory.entity('A1', {
            template: factory.id('templateA'),
          }),
          factory.entity('B1', {
            template: factory.id('templateB'),
            metadata: {
              relationship_b: [factory.metadataValue('A1')],
            },
          }),
          factory.entity('C1', {
            template: factory.id('templateC'),
            metadata: {
              relationship_c: [factory.metadataValue('A1')],
            },
          }),
        ],
      };

      await load(fixtures);

      await modifyEntity('A1', {
        title: 'new A1',
        metadata: { text1: [{ value: 'text 1 changed' }], text2: [{ value: 'text 2 changed' }] },
      });

      const [relatedB, relatedC] = [
        await entities.getById('B1', 'en'),
        await entities.getById('C1', 'en'),
      ];

      expect(relatedB?.metadata).toEqual({
        relationship_b: [
          expect.objectContaining({
            label: 'new A1',
            inheritedValue: [{ value: 'text 1 changed' }],
          }),
        ],
      });

      expect(relatedC?.metadata).toEqual({
        relationship_c: [
          expect.objectContaining({
            label: 'new A1',
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
            _id: factory.id('templateA'),
            properties: [
              factory.relationshipProp('relationship', 'templateB', 'rel1', {
                inherit: { type: 'multiselect', property: factory.id('multiselect').toString() },
              }),
            ],
          },
          {
            _id: factory.id('templateB'),
            properties: [
              factory.property('multiselect', 'multiselect', {
                content: factory.id('thesauri').toString(),
              }),
            ],
          },
        ],
        dictionaries: [factory.thesauri('thesauri', ['T1', 'T2', 'T3'])],
        entities: [
          factory.entity('A1', {
            template: factory.id('templateA'),
            metadata: {
              relationship: [factory.metadataValue('B1'), factory.metadataValue('B2')],
            },
          }),
          factory.entity('B1', {
            template: factory.id('templateB'),
            metadata: { multiselect: [factory.metadataValue('T1')] },
          }),
          factory.entity('B2', { template: factory.id('templateB') }),
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

      await thesauris.save(factory.thesauri('thesauri', [['T1', 'new 1'], 'T2', ['T3', 'new 3']]));

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
            _id: factory.id('templateA'),
            properties: [
              factory.relationshipProp('relationship', 'templateB', 'rel1', {
                inherit: { type: 'relationship', property: factory.id('relationshipB').toString() },
              }),
            ],
          },
          {
            _id: factory.id('templateB'),
            properties: [factory.relationshipProp('relationshipB', 'templateC', 'rel1')],
          },
          { _id: factory.id('templateC'), properties: [] },
        ],
        entities: [
          factory.entity('A1', {
            template: factory.id('templateA'),
            metadata: { relationship: [factory.metadataValue('B1'), factory.metadataValue('B2')] },
          }),
          factory.entity('B1', { template: factory.id('templateB') }),
          factory.entity('B2', { template: factory.id('templateB') }),

          factory.entity('C1', { template: factory.id('templateC') }),
          factory.entity('C2', { template: factory.id('templateC') }),
        ],
      };
      await load(fixtures);
      await modifyEntity('B1', { metadata: { relationshipB: [{ value: 'C1' }] } });
      await modifyEntity('B2', { metadata: { relationshipB: [{ value: 'C2' }] } });
    });

    it('should update denormalized properties when relationship selected changes', async () => {
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
