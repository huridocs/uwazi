/* eslint-disable max-lines */
import db, { DBFixture } from 'api/utils/testing_db';
import entities from 'api/entities';

import { EntitySchema } from 'shared/types/entityType';
import thesauris from 'api/thesauri';
import { elasticTesting } from 'api/utils/elastic_testing';
import translations from 'api/i18n/translations';
import { getFixturesFactory } from '../../utils/fixturesFactory';

const load = async (data: DBFixture, index?: string) =>
  db.setupFixturesAndContext(
    {
      ...data,
      settings: [
        {
          _id: db.id(),
          languages: [
            { key: 'en', label: 'EN', default: true },
            { key: 'es', label: 'ES' },
          ],
        },
      ],
    },
    index
  );

// eslint-disable-next-line max-statements
describe('Denormalize relationships', () => {
  const factory = getFixturesFactory();
  const createTranslationDBO = factory.v2.database.translationDBO;

  const modifyEntity = async (id: string, entityData: EntitySchema, language: string = 'en') => {
    await entities.save(
      { _id: factory.id(`${id}-${language}`), sharedId: id, ...entityData, language },
      { language, user: {} },
      true
    );
  };

  afterAll(async () => db.disconnect());

  describe('title, published state and basic property (text)', () => {
    it('should update denormalized title, published state and icon', async () => {
      const fixtures: DBFixture = {
        templates: [
          factory.template('templateA', [
            factory.relationshipProp('relationship', 'templateB', 'text'),
          ]),
          factory.template('templateB', [factory.property('text')]),
        ],
        entities: [
          factory.entity('A1', 'templateA', {}),
          factory.entity('B1', 'templateB', {}, { icon: { _id: 'icon_id' }, published: true }),
          factory.entity('B2', 'templateB', {}, { published: true }),
          factory.entity('B3', 'templateB', {}, { published: false }),
        ],
      };

      await load(fixtures);

      await modifyEntity('A1', {
        metadata: {
          relationship: [
            factory.metadataValue('B1'),
            factory.metadataValue('B2'),
            factory.metadataValue('B3'),
          ],
        },
      });
      await modifyEntity('B1', { title: 'new Title' });
      await modifyEntity('B2', { title: 'new Title 2' });
      await modifyEntity('B3', { title: 'new Title 3' });

      const relatedEntity = await entities.getById('A1', 'en');
      expect(relatedEntity?.metadata).toMatchObject({
        relationship: [
          { label: 'new Title', icon: { _id: 'icon_id' }, published: true },
          { label: 'new Title 2', published: true },
          { label: 'new Title 3', published: false },
        ],
      });
    });

    it('should update title, published state, icon and text property on related entities denormalized properties', async () => {
      const fixtures: DBFixture = {
        templates: [
          factory.template('templateA', [
            factory.inherit('relationship', 'templateB', 'text'),
            factory.inherit('relationship2', 'templateC', 'another_text'),
          ]),
          factory.template('templateB', [factory.property('text')]),
          factory.template('templateC', [factory.property('another_text')]),
        ],
        entities: [
          factory.entity('A1', 'templateA', {
            relationship: [factory.metadataValue('B1'), factory.metadataValue('B2')],
            relationship2: [factory.metadataValue('C1')],
          }),
          factory.entity(
            'B1',
            'templateB',
            {},
            {
              icon: { _id: 'icon_id', label: 'icon_label', type: 'icon_type' },
              published: true,
            }
          ),
          factory.entity('B2', 'templateB', {}, { published: true }),
          factory.entity('C1', 'templateC', {}, { published: true }),
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
      expect(relatedEntity?.metadata).toMatchObject({
        relationship: [
          {
            label: 'new Title',
            icon: { _id: 'icon_id', label: 'icon_label', type: 'icon_type' },
            inheritedValue: [{ value: 'text 1 changed' }],
            published: true,
          },
          {
            label: 'new Title 2',
            inheritedValue: [{ value: 'text 2 changed' }],
            published: true,
          },
        ],
        relationship2: [
          {
            label: 'new Title C1',
            inheritedValue: [{ value: 'another text changed' }],
            published: true,
          },
        ],
      });
    });

    it('should update title, published state and text property denormalized on related entities from 2 different templates', async () => {
      const fixtures: DBFixture = {
        templates: [
          factory.template('templateA', [
            factory.property('text'),
            factory.property('another_text'),
          ]),
          factory.template('templateB', [factory.inherit('relationship', 'templateA', 'text')]),
          factory.template('templateC', [
            factory.inherit('relationship', 'templateA', 'another_text'),
          ]),
          factory.template('templateD', [factory.relationshipProp('relationship', 'templateA')]),
          factory.template('templateE', [factory.relationshipProp('relationship', 'templateA')]),
        ],
        entities: [
          factory.entity('A1', 'templateA', {}, { published: true }),
          factory.entity('B1', 'templateB', { relationship: [factory.metadataValue('A1')] }),
          factory.entity('B2', 'templateB', { relationship: [factory.metadataValue('A1')] }),
          factory.entity('C1', 'templateC', { relationship: [factory.metadataValue('A1')] }),
          factory.entity('D1', 'templateD', { relationship: [factory.metadataValue('A1')] }),
          factory.entity('E1', 'templateD', { relationship: [factory.metadataValue('A1')] }),
        ],
      };

      await load(fixtures);

      await modifyEntity('A1', {
        title: 'new A1',
        metadata: {
          text: [{ value: 'text changed' }],
          another_text: [{ value: 'another_text changed' }],
        },
      });

      const [relatedB1, relatedB2, relatedC, relatedD, relatedE] = [
        await entities.getById('B1', 'en'),
        await entities.getById('B2', 'en'),
        await entities.getById('C1', 'en'),
        await entities.getById('D1', 'en'),
        await entities.getById('E1', 'en'),
      ];

      expect(relatedB1?.metadata?.relationship).toMatchObject([
        { label: 'new A1', inheritedValue: [{ value: 'text changed' }], published: true },
      ]);

      expect(relatedB2?.metadata?.relationship).toMatchObject([
        { label: 'new A1', inheritedValue: [{ value: 'text changed' }], published: true },
      ]);

      expect(relatedC?.metadata?.relationship).toMatchObject([
        { label: 'new A1', inheritedValue: [{ value: 'another_text changed' }], published: true },
      ]);

      expect(relatedD?.metadata?.relationship).toMatchObject([
        { label: 'new A1', published: true },
      ]);
      expect(relatedE?.metadata?.relationship).toMatchObject([
        { label: 'new A1', published: true },
      ]);
    });

    it('should update title, published state and 2 different text properties denormalized on related entities', async () => {
      const fixtures: DBFixture = {
        templates: [
          factory.template('templateA', [factory.property('text1'), factory.property('text2')]),
          factory.template('templateB', [factory.inherit('relationship_b', 'templateA', 'text1')]),
          factory.template('templateC', [factory.inherit('relationship_c', 'templateA', 'text2')]),
        ],
        entities: [
          factory.entity('A1', 'templateA', {}, { published: false }),
          factory.entity('B1', 'templateB', { relationship_b: [factory.metadataValue('A1')] }),
          factory.entity('C1', 'templateC', { relationship_c: [factory.metadataValue('A1')] }),
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

      expect(relatedB?.metadata?.relationship_b).toMatchObject([
        { label: 'new A1', inheritedValue: [{ value: 'text 1 changed' }], published: false },
      ]);

      expect(relatedC?.metadata?.relationship_c).toMatchObject([
        { label: 'new A1', inheritedValue: [{ value: 'text 2 changed' }], published: false },
      ]);
    });
  });

  describe('when the relationship property has no content', () => {
    const fixtures: DBFixture = {
      templates: [
        factory.template('templateA', [
          factory.relationshipProp('relationship', '', { content: '' }),
        ]),
        factory.template('templateB'),
        factory.template('templateC'),
      ],
      entities: [
        factory.entity('A1', 'templateA', {
          relationship: [factory.metadataValue('B1'), factory.metadataValue('C1')],
        }),
        factory.entity('B1', 'templateB', {}, { published: true }),
        factory.entity('C1', 'templateC', {}, { published: false }),
      ],
    };

    it('should denormalize and index the title, and denormalize the published state on related entities', async () => {
      await load(fixtures, 'index_denormalization');

      await modifyEntity('A1', {
        metadata: { relationship: [factory.metadataValue('B1'), factory.metadataValue('C1')] },
      });

      await modifyEntity('B1', { title: 'new B1' });
      await modifyEntity('C1', { title: 'new C1' });

      const relatedEntity = await entities.getById('A1', 'en');

      expect(relatedEntity?.metadata?.relationship).toMatchObject([
        {
          label: 'new B1',
          published: true,
        },
        {
          label: 'new C1',
          published: false,
        },
      ]);

      await elasticTesting.refresh();
      const results = await elasticTesting.getIndexedEntities();

      const [A1] = results.filter(r => r.sharedId === 'A1');

      expect(A1?.metadata?.relationship).toMatchObject([
        {
          label: 'new B1',
          published: true,
        },
        {
          label: 'new C1',
          published: false,
        },
      ]);
    });
  });

  describe('inherited select/multiselect (thesauri)', () => {
    beforeEach(async () => {
      jest.spyOn(translations, 'updateContext').mockImplementation(async () => 'ok');
      const fixtures: DBFixture = {
        templates: [
          factory.template('templateA', [
            factory.inherit('relationship', 'templateB', 'multiselect'),
          ]),
          factory.template('templateB', [
            factory.property('multiselect', 'multiselect', {
              content: factory.id('thesauri').toString(),
            }),
            factory.property('property_without_content'),
          ]),
        ],
        dictionaries: [factory.thesauri('thesauri', ['T1', 'T2', 'T3'])],
        entities: [
          factory.entity('A1', 'templateA', {
            relationship: [factory.metadataValue('B1'), factory.metadataValue('B2')],
          }),
          factory.entity('B1', 'templateB', {
            multiselect: [factory.metadataValue('T1')],
          }),
          factory.entity('B2', 'templateB'),
          factory.entity('entityWithNoValueSelected', 'templateB'),
        ],
      };
      await load(fixtures, 'index_denormalize');
    });

    it('should update denormalized properties when thesauri selected changes', async () => {
      await modifyEntity('B1', {
        metadata: { multiselect: [{ value: 'T2' }, { value: 'T3' }] },
      });

      await modifyEntity('B2', {
        metadata: { multiselect: [{ value: 'T1' }] },
      });

      const relatedEntity = await entities.getById('A1', 'en');
      expect(relatedEntity?.metadata?.relationship).toMatchObject([
        {
          inheritedValue: [
            { value: 'T2', label: 'T2' },
            { value: 'T3', label: 'T3' },
          ],
        },
        {
          inheritedValue: [{ value: 'T1', label: 'T1' }],
        },
      ]);
    });

    it('should update and index denormalized properties when thesauri label changes (should ignore null inheritedValues)', async () => {
      await modifyEntity('B1', {
        metadata: { multiselect: [{ value: 'T2' }, { value: 'T3' }] },
      });
      await modifyEntity('B2', {
        metadata: { multiselect: [{ value: 'T1' }] },
      });

      await modifyEntity('A1', {
        metadata: {
          relationship: [
            factory.metadataValue('B1'),
            factory.metadataValue('B2'),
            factory.metadataValue('entityWithNoValueSelected'),
          ],
        },
      });

      await thesauris.save(factory.thesauri('thesauri', [['T1', 'new 1'], 'T2', ['T3', 'new 3']]));

      await elasticTesting.refresh();
      const results = await elasticTesting.getIndexedEntities();

      const A1 = results.find(r => r.sharedId === 'A1');

      expect(A1?.metadata?.relationship).toMatchObject([
        {
          inheritedValue: [
            { value: 'T2', label: 'T2' },
            { value: 'T3', label: 'new 3' },
          ],
        },
        {
          inheritedValue: [{ value: 'T1', label: 'new 1' }],
        },
        {
          inheritedValue: [],
        },
      ]);
    });
  });

  describe('inherited relationship', () => {
    beforeEach(async () => {
      const fixtures: DBFixture = {
        templates: [
          factory.template('templateA', [
            factory.inherit('relationship', 'templateB', 'relationshipB'),
          ]),
          factory.template('templateB', [factory.relationshipProp('relationshipB', 'templateC')]),
          factory.template('templateC'),
          factory.template('templateD', [
            factory.inherit('relationshipD', 'templateA', 'relationship'),
          ]),
        ],
        entities: [
          factory.entity('A1', 'templateA', { relationship: [{ value: 'B1' }, { value: 'B2' }] }),
          factory.entity('A2', 'templateA', { relationship: [{ value: 'B1' }, { value: 'B2' }] }),
          factory.entity('B1', 'templateB'),
          factory.entity('B2', 'templateB'),
          factory.entity('C1', 'templateC'),
          factory.entity('C2', 'templateC'),
        ],
      };
      await load(fixtures);
      await modifyEntity('B1', { metadata: { relationshipB: [{ value: 'C1' }] } });
      await modifyEntity('B2', { metadata: { relationshipB: [{ value: 'C2' }, { value: 'C1' }] } });
      await modifyEntity('A1', { metadata: { relationship: [{ value: 'B1' }, { value: 'B2' }] } });
      await modifyEntity('A2', { metadata: { relationship: [{ value: 'B1' }, { value: 'B2' }] } });
    });

    it('should update denormalized properties when relationship selected changes', async () => {
      const relatedEntity = await entities.getById('A1', 'en');
      expect(relatedEntity?.metadata?.relationship).toMatchObject([
        { inheritedValue: [{ value: 'C1', label: 'C1' }] },
        {
          inheritedValue: [
            { value: 'C2', label: 'C2' },
            { value: 'C1', label: 'C1' },
          ],
        },
      ]);
    });

    it('should update denormalized properties when relationship inherited label changes', async () => {
      await modifyEntity('C1', { title: 'new C1' });
      await modifyEntity('C2', { title: 'new C2' });

      const relatedEntity = await entities.getById('A1', 'en');

      expect(relatedEntity?.metadata?.relationship).toMatchObject([
        { inheritedValue: [{ value: 'C1', label: 'new C1' }] },
        {
          inheritedValue: [
            { value: 'C2', label: 'new C2' },
            { value: 'C1', label: 'new C1' },
          ],
        },
      ]);
    });
  });

  describe('languages and indexation', () => {
    beforeEach(async () => {
      await load(
        {
          templates: [
            factory.template('templateA', [
              factory.inherit('relationshipA', 'templateB', 'relationshipB'),
            ]),
            factory.template('templateB', [factory.inherit('relationshipB', 'templateC', 'text')]),
            factory.template('templateC', [factory.property('text')]),
          ],
          entities: [
            factory.entity('A1', 'templateA', {}),
            factory.entity('A1', 'templateA', {}, { language: 'es' }),
            factory.entity('B1', 'templateB', {}, { published: false }),
            factory.entity('B1', 'templateB', {}, { language: 'es', published: false }),
            factory.entity('C1', 'templateC', {}, { published: true }),
            factory.entity('C1', 'templateC', {}, { language: 'es', published: true }),
          ],
        },
        'index_denormalization'
      );

      /// generate inherited values !
      await modifyEntity('C1', { metadata: { text: [{ value: 'text' }] } });
      await modifyEntity('C1', { metadata: { text: [{ value: 'texto' }] } }, 'es');

      await modifyEntity(
        'B1',
        { metadata: { relationshipB: [factory.metadataValue('C1')] } },
        'en'
      );
      await modifyEntity(
        'B1',
        { metadata: { relationshipB: [factory.metadataValue('C1')] } },
        'es'
      );

      await modifyEntity(
        'A1',
        { metadata: { relationshipA: [factory.metadataValue('B1')] } },
        'en'
      );
      await modifyEntity(
        'A1',
        { metadata: { relationshipA: [factory.metadataValue('B1')] } },
        'es'
      );
      ///
    });

    it('should index the correct entities on a simple relationship', async () => {
      await modifyEntity(
        'C1',
        { title: 'new Es title', metadata: { text: [{ value: 'nuevo texto para ES' }] } },
        'es'
      );

      await elasticTesting.refresh();
      const results = await elasticTesting.getIndexedEntities();

      const B1en = results.find(r => r.sharedId === 'B1' && r.language === 'en');
      const B1es = results.find(r => r.sharedId === 'B1' && r.language === 'es');

      expect(B1en?.metadata?.relationshipB).toMatchObject([
        { value: 'C1', label: 'C1', inheritedValue: [{ value: 'text' }], published: true },
      ]);
      expect(B1es?.metadata?.relationshipB).toMatchObject([
        {
          value: 'C1',
          label: 'new Es title',
          inheritedValue: [{ value: 'nuevo texto para ES' }],
          published: true,
        },
      ]);
    });

    it('should index the correct entities on a transitive relationship', async () => {
      await modifyEntity('C1', { title: 'new Es title' }, 'es');
      await elasticTesting.refresh();
      const results = await elasticTesting.getIndexedEntities();

      const A1en = results.find(r => r.sharedId === 'A1' && r.language === 'en');
      const A1es = results.find(r => r.sharedId === 'A1' && r.language === 'es');

      expect(A1en?.metadata?.relationshipA).toMatchObject([
        { value: 'B1', inheritedValue: [{ label: 'C1', published: true }], published: false },
      ]);

      expect(A1es?.metadata?.relationshipA).toMatchObject([
        {
          value: 'B1',
          inheritedValue: [{ label: 'new Es title', published: true }],
          published: false,
        },
      ]);
    });
  });

  describe('when changing a multiselect in one language', () => {
    beforeEach(async () => {
      await load(
        {
          templates: [
            factory.template('templateA', [
              factory.inherit('relationshipA', 'templateB', 'multiselect'),
            ]),
            factory.template('templateB', [
              factory.property('multiselect', 'multiselect', {
                content: factory.id('thesauri').toString(),
              }),
            ]),
          ],
          dictionaries: [factory.thesauri('thesauri', ['T1', 'T2', 'T3'])],
          entities: [
            factory.entity('A1', 'templateA', { relationshipA: [factory.metadataValue('B1')] }),
            factory.entity(
              'A1',
              'templateA',
              { relationshipA: [factory.metadataValue('B1')] },
              { language: 'es' }
            ),
            factory.entity('B1', 'templateB', {
              multiselect: [factory.metadataValue('T1')],
            }),
            factory.entity(
              'B1',
              'templateB',
              {
                multiselect: [factory.metadataValue('T1')],
              },
              { language: 'es' }
            ),
          ],
        },
        'index_denormalization'
      );
    });

    it('should denormalize the VALUE for all the languages', async () => {
      await modifyEntity('B1', {
        metadata: { multiselect: [{ value: 'T1' }, { value: 'T2' }] },
      });

      await elasticTesting.refresh();
      const results = await elasticTesting.getIndexedEntities();

      const A1en = results.find(r => r.sharedId === 'A1' && r.language === 'en');
      const A1es = results.find(r => r.sharedId === 'A1' && r.language === 'es');

      expect(A1en?.metadata?.relationshipA).toMatchObject([
        { value: 'B1', inheritedValue: [{ value: 'T1' }, { value: 'T2' }] },
      ]);

      expect(A1es?.metadata?.relationshipA).toMatchObject([
        { value: 'B1', inheritedValue: [{ value: 'T1' }, { value: 'T2' }] },
      ]);
    });
  });

  describe('thesauri translations', () => {
    beforeEach(async () => {
      await load(
        {
          dictionaries: [factory.thesauri('Numbers', ['One', 'Two'])],
          templates: [
            factory.template('templateA', [
              factory.property('select', 'select', {
                content: factory.id('Numbers').toString(),
              }),
            ]),
          ],
          entities: [
            factory.entity(
              'A1',
              'templateA',
              {
                select: [{ value: 'One', label: 'One' }],
              },
              { language: 'en' }
            ),
            factory.entity(
              'A1',
              'templateA',
              {
                select: [{ value: 'One', label: 'One' }],
              },
              { language: 'es' }
            ),
          ],
          translationsV2: [
            createTranslationDBO('One', 'One', 'en', {
              id: factory.id('Numbers').toString(),
              type: 'Thesaurus',
              label: 'Numbers',
            }),
            createTranslationDBO('Two', 'Two', 'en', {
              id: factory.id('Numbers').toString(),
              type: 'Thesaurus',
              label: 'Numbers',
            }),
            createTranslationDBO('Numbers', 'Numbers', 'en', {
              id: factory.id('Numbers').toString(),
              type: 'Thesaurus',
              label: 'Numbers',
            }),

            createTranslationDBO('One', 'One', 'es', {
              id: factory.id('Numbers').toString(),
              type: 'Thesaurus',
              label: 'Numbers',
            }),
            createTranslationDBO('Two', 'Two', 'es', {
              id: factory.id('Numbers').toString(),
              type: 'Thesaurus',
              label: 'Numbers',
            }),
            createTranslationDBO('Numbers', 'Numbers', 'es', {
              id: factory.id('Numbers').toString(),
              type: 'Thesaurus',
              label: 'Numbers',
            }),
          ],
        },
        'index_denormalization'
      );
    });

    it('should update entities when translating thesauri values', async () => {
      await translations.save({
        locale: 'es',
        contexts: [
          {
            id: factory.id('Numbers').toString(),
            label: 'Numbers',
            values: [
              {
                key: 'One',
                value: 'Uno',
              },
              {
                key: 'Two',
                value: 'Dos',
              },
              {
                key: 'Numbers',
                value: 'Números',
              },
            ],
            type: 'Thesaurus',
          },
        ],
      });
      await elasticTesting.refresh();
      const results = await elasticTesting.getIndexedEntities();
      const englishEntity = results.find(r => r.sharedId === 'A1' && r.language === 'en');
      const spanishEntity = results.find(r => r.sharedId === 'A1' && r.language === 'es');
      expect(englishEntity?.metadata?.select).toMatchObject([{ value: 'One', label: 'One' }]);
      expect(spanishEntity?.metadata?.select).toMatchObject([{ value: 'One', label: 'Uno' }]);
    });
  });
});
