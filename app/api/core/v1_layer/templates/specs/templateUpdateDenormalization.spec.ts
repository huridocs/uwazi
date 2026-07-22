/* eslint-disable max-statements */
import { ValidationError } from '#api/common.v2/validation/ValidationError.js';
import { TemplateUpdateDenormalizeEntitiesBatch } from '#api/core/application/TemplateUpdateDenormalizeEntitiesBatch.js';
import { EntitiesDataSourceFactory } from '#api/core/infrastructure/factories/EntitiesDataSourceFactory.js';
import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';
import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { TemplatePostProcessEntitiesJob } from '#api/core/infrastructure/jobs/TemplatePostProcessEntitiesJob.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoRelationshipsV1DataSource } from '#api/core/infrastructure/mongodb/MongoRelationshipsV1DataSource.js';
import { applicationEventsBus } from '#api/core/libs/eventsbus/index.js';
import { SyncDispatcherForTests } from '#api/core/libs/queue/infrastructure/SyncDispatcherForTests.js';
import { EntityUpdatedData, EntityUpdatedEvent } from '#api/entities/events/EntityUpdatedEvent.js';
import { TemplateSchema } from '#api/migrations/migrations/143-parse-numeric-fields/types.js';
import relationships from '#api/relationships/relationships.js';
import * as setupSockets from '#api/socketio/setupSockets.js';
import { elasticTesting } from '#api/utils/elastic_testing.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import testingDB, { DBFixture } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import * as idGenerator from '#shared/IDGenerator.js';
import { propertyTypes } from '#shared/propertyTypes.js';
import { EntitySchema } from '#shared/types/entityType.js';
import templates from '../templates.js';

const f = getFixturesFactory();

const getEntitiesByTemplate = async (
  templateId: string,
  source: 'mongo' | 'elastic' = 'mongo',
  language: string = 'en'
): Promise<EntitySchema[]> => {
  if (source === 'mongo') {
    const allEntities = await testingEnvironment.db.getAllFrom('entities');
    const filtered =
      allEntities?.filter(
        entity =>
          entity.template?.toString() === f.idString(templateId) && entity.language === language
      ) || [];
    return filtered.sort((a, b) => (a.sharedId || '').localeCompare(b.sharedId || ''));
  }
  await elasticTesting.refresh();
  const allEntities = await elasticTesting.getIndexedEntities();
  return (
    allEntities
      ?.filter(
        entity =>
          entity.template?.toString() === f.idString(templateId) && entity.language === language
      )
      .sort((a, b) => (a.sharedId || '').localeCompare(b.sharedId || '')) || []
  );
};

const createConnection = (entityA: string, entityB: string, relType: string, hub: string) => {
  const hubId = f.id(hub);
  return [
    { _id: testingDB.id(), entity: entityA, template: f.idString(relType), hub: hubId },
    { _id: testingDB.id(), entity: entityB, template: f.idString(relType), hub: hubId },
  ];
};

afterAll(async () => {
  await testingEnvironment.tearDown();
});

async function updateTemplate(template: TemplateSchema, fullReindex = false) {
  jest.spyOn(setupSockets, 'emitToTenant').mockImplementation();

  const transactionManager = TransactionManagerFactory.default();
  const jobsDispatcher = new SyncDispatcherForTests({
    TemplatePostProcessEntitiesJob: async () =>
      new TemplatePostProcessEntitiesJob({
        useCase: new TemplateUpdateDenormalizeEntitiesBatch({
          entitiesDS: EntitiesDataSourceFactory.default({ transactionManager }),
          relationshipsV1DS: new MongoRelationshipsV1DataSource(
            getConnection(),
            transactionManager
          ),
          templatesDS: TemplatesDataSourceFactory.default({ transactionManager }),
          transactionManager,
          filesDS: FilesDataSourceFactory.default(),
        }),
        templatesDS: TemplatesDataSourceFactory.default({ transactionManager }),
      }),
  });
  return testingEnvironment.runWithContext(
    async () => templates.save(template, 'en', true, fullReindex),
    {
      factories: {
        jobsDispatcher: () => jobsDispatcher,
      },
    }
  );
}

const elasticIndex = 'templates_denorm_flow';

describe('Templates Update', () => {
  async function setUpFixtures(_fixtures: DBFixture) {
    await testingEnvironment.setUp(_fixtures, elasticIndex);

    const templatesById = new Map(
      (_fixtures.templates || []).map((template: any) => [template._id?.toString?.(), template])
    );

    await testingEnvironment.runWithContext(async () => {
      const entitiesInDefaultLanguage = (_fixtures.entities || []).filter(
        entity => entity.language === 'en' && entity.template
      );

      // Keep fixture metadata shape close to persisted entities.save output:
      // ensure all template properties exist with empty array values.
      await Promise.all(
        (_fixtures.entities || []).map(async entity => {
          if (!entity.template || !entity._id) {
            return;
          }
          const template = templatesById.get(entity.template.toString()) as any;
          if (!template?.properties) {
            return;
          }

          const metadata = { ...(entity.metadata || {}) } as Record<string, any[]>;
          template.properties.forEach((property: any) => {
            if (!metadata[property.name]) {
              metadata[property.name] = [];
            }
          });

          await testingEnvironment.db
            .getCollection('entities')
            ?.updateOne({ _id: entity._id as any }, { $set: { metadata } });
        })
      );

      await Promise.all(
        entitiesInDefaultLanguage.map(async entity => {
          if (!entity.template) {
            return;
          }
          const template = templatesById.get(entity.template.toString());
          if (template) {
            await relationships.saveEntityBasedReferences(entity, 'en', template);
          }
        })
      );

      const sharedIds = Array.from(
        new Set(entitiesInDefaultLanguage.map(entity => entity.sharedId))
      );
      await relationships.updateEntitiesMetadata(sharedIds, 'en');
    });

    testingTenants.mockCurrentTenant({
      name: testingDB.dbName,
      dbName: testingDB.dbName,
      indexName: elasticIndex,
    });
  }
  const fixtures: DBFixture = {
    settings: [
      {
        languages: [
          { key: 'en', label: 'English', default: true },
          { key: 'es', label: 'Español' },
        ],
      },
    ],
    translationsV2: [
      {
        _id: f.id('translation_text_property_b'),
        language: 'en',
        key: 'text_property_b',
        value: 'text_property_b',
        context: {
          type: 'Entity',
          label: 'text_property_b',
          id: f.idString('templateB'),
        },
      },
    ],
    relationtypes: [f.relationType('rel1'), f.relationType('rel2'), f.relationType('rel')],
    templates: [
      f.template('templateA', [f.property('text_property')]),
      f.template('templateB', [
        f.relationshipProp('rel_prop', 'templateA'),
        f.property('text_property_b'),
      ]),
      f.template('templateC', [f.property('text_property_2')]),
    ],
    entities: [
      f.entity(
        'entityA1',
        'templateA',
        { text_property: [f.metadataValue('text value A 1')] },
        { title: 'entityA1 english', language: 'en' }
      ),
      f.entity(
        'entityA1',
        'templateA',
        { text_property: [f.metadataValue('valor texto A 1')] },
        { title: 'entityA1 spanish', language: 'es' }
      ),
      f.entity(
        'entityA2',
        'templateA',
        { text_property: [f.metadataValue('text value A 2')] },
        { title: 'entityA2 english', language: 'en' }
      ),
      f.entity(
        'entityA2',
        'templateA',
        { text_property: [f.metadataValue('valor texto A 2')] },
        { title: 'entityA2 spanish', language: 'es' }
      ),

      f.entity(
        'entityB1',
        'templateB',
        { rel_prop: [f.metadataValue('entityA1', '')] },
        { title: 'entityB1 english', language: 'en' }
      ),

      f.entity(
        'entityB1',
        'templateB',
        { rel_prop: [f.metadataValue('entityA1', '')] },
        { title: 'entityB1 spanish', language: 'es' }
      ),

      f.entity(
        'entityB2',
        'templateB',
        { rel_prop: [f.metadataValue('entityA2', '')] },
        { title: 'entityB2 english', language: 'en' }
      ),

      f.entity(
        'entityB2',
        'templateB',
        { rel_prop: [f.metadataValue('entityA2', '')] },
        { title: 'entityB2 spanish', language: 'es' }
      ),
      f.entity(
        'entityA3',
        'templateA',
        {},
        {
          title: 'entityA3 english',
          icon: { _id: 'id', type: 'type', label: 'icon' },
          language: 'en',
        }
      ),
      f.entity(
        'entityA3',
        'templateA',
        {},
        {
          title: 'entityA3 spanish',
          icon: { _id: 'id', type: 'type', label: 'icon' },
          language: 'es',
        }
      ),
    ],
    connections: [...createConnection('entityB1', 'entityA3', 'rel', 'hub1')],
  };

  beforeAll(async () => {
    await setUpFixtures(fixtures);
  });

  afterEach(() => {
    applicationEventsBus.clear();
  });

  describe('Validations', () => {
    it('invalid when trying to delete an inherited property', async () => {
      const template = f.template('templateB', [
        f.relationshipProp('rel_prop', 'templateA', {
          inherit: { property: f.idString('text_property'), type: 'text' },
        }),
        f.property('text_property_b'),
      ]);

      await updateTemplate(template);
      const templateWithDeletedInheritedProp = f.template('templateA', []);

      await expect(async () => updateTemplate(templateWithDeletedInheritedProp)).rejects.toThrow(
        'Properties can not be deleted because are being inherited: [properties=text_property]'
      );
    });
  });

  describe('templates denormalization scenarios', () => {
    describe('when toggling filter on a property (no other changes)', () => {
      it('should update editDate on all entities of that template', async () => {
        await setUpFixtures(fixtures);

        const entitiesBefore = (await testingEnvironment.db.getAllFrom('entities')).filter(
          e => e.template?.toString() === f.idString('templateA') && e.language === 'en'
        );
        const editDateBefore = (entitiesBefore[0].editDate as number) || 0;

        await new Promise(r => {
          setTimeout(r, 10);
        });

        await updateTemplate(
          f.template('templateA', [f.property('text_property', 'text', { filter: true })])
        );

        const entitiesAfter = (await testingEnvironment.db.getAllFrom('entities')).filter(
          e => e.template?.toString() === f.idString('templateA') && e.language === 'en'
        );

        entitiesAfter.forEach(entity => {
          expect(entity.editDate as number).toBeGreaterThan(editDateBefore);
        });
      });
    });

    describe('when changing a property name and template contains relationship properties', () => {
      it('should change the name on all entities and reindex', async () => {
        const propertyWithNameChanged = f.property('text_property_b', 'text', {
          label: 'name_changed',
        });
        const template = f.template('templateB', [
          f.relationshipProp('rel_prop', 'templateA'),
          propertyWithNameChanged,
        ]);

        await updateTemplate(template);

        const expectedEn = [
          { sharedId: 'entityB1', metadata: { name_changed: [] } },
          { sharedId: 'entityB2', metadata: { name_changed: [] } },
        ];

        expect(await getEntitiesByTemplate('templateB')).toMatchObject(expectedEn);
        expect(await getEntitiesByTemplate('templateB', 'elastic')).toMatchObject(expectedEn);
      });
    });

    describe('when deleting a property and template contains relationship properties', () => {
      it('should delete the property on all entities and reindex', async () => {
        const template = f.template('templateB', [f.relationshipProp('rel_prop', 'templateA')]);
        await updateTemplate(template);

        expect(
          (await getEntitiesByTemplate('templateB'))[0].metadata?.text_property_b
        ).toBeUndefined();
        expect(
          (await getEntitiesByTemplate('templateB'))[1].metadata?.text_property_b
        ).toBeUndefined();

        expect(
          (await getEntitiesByTemplate('templateB', 'elastic'))[0].metadata?.text_property_b
        ).toBeUndefined();
        expect(
          (await getEntitiesByTemplate('templateB', 'elastic'))[1].metadata?.text_property_b
        ).toBeUndefined();
      });
    });

    describe('when changing a relationship property "inherit"', () => {
      it('should correctly inherit and denormalize properties from related templates', async () => {
        const template = f.template('templateB', [
          f.relationshipProp('rel_prop', 'templateA', {
            inherit: { property: f.idString('text_property'), type: 'text' },
          }),
        ]);

        await updateTemplate(template);

        const expectedEn = [
          {
            sharedId: 'entityB1',
            metadata: { rel_prop: [{ inheritedValue: [{ value: 'text value A 1' }] }] },
          },
          {
            sharedId: 'entityB2',
            metadata: { rel_prop: [{ inheritedValue: [{ value: 'text value A 2' }] }] },
          },
        ];

        expect(await getEntitiesByTemplate('templateB')).toMatchObject(expectedEn);
        expect(await getEntitiesByTemplate('templateB', 'elastic')).toMatchObject(expectedEn);

        const expectedEs = [
          {
            sharedId: 'entityB1',
            metadata: { rel_prop: [{ inheritedValue: [{ value: 'valor texto A 1' }] }] },
          },
          {
            sharedId: 'entityB2',
            metadata: { rel_prop: [{ inheritedValue: [{ value: 'valor texto A 2' }] }] },
          },
        ];

        expect(await getEntitiesByTemplate('templateB', 'mongo', 'es')).toMatchObject(expectedEs);
        expect(await getEntitiesByTemplate('templateB', 'elastic', 'es')).toMatchObject(expectedEs);
      });
    });

    describe('when changing a relationship property "relationType"', () => {
      it('should delete values belonging to the previous relationType', async () => {
        const template = f.template('templateB', [
          f.relationshipProp('rel_prop', 'templateA', {
            relationType: f.idString('rel2'),
          }),
        ]);

        await updateTemplate(template);

        const expected = [
          { sharedId: 'entityB1', metadata: { rel_prop: [] } },
          { sharedId: 'entityB2', metadata: { rel_prop: [] } },
        ];

        expect(await getEntitiesByTemplate('templateB')).toMatchObject(expected);
        expect(await getEntitiesByTemplate('templateB', 'elastic')).toMatchObject(expected);
      });

      it('should create metadata values if connections with the new relationType exist', async () => {
        const template = f.template('templateB', [
          f.relationshipProp('rel_prop', 'templateA', {
            relationType: f.idString('rel'),
          }),
        ]);

        await updateTemplate(template);

        const expected = [
          {
            sharedId: 'entityB1',
            metadata: { rel_prop: [{ label: 'entityA3 english', icon: { label: 'icon' } }] },
          },
          { sharedId: 'entityB2', metadata: { rel_prop: [] } },
        ];

        expect(await getEntitiesByTemplate('templateB')).toMatchObject(expected);
        expect(await getEntitiesByTemplate('templateB', 'elastic')).toMatchObject(expected);
      });
    });

    describe('when changing a relationship property "content" (target template)', () => {
      it('should delete values belonging to the previous content', async () => {
        const template = f.template('templateB', [f.relationshipProp('rel_prop', 'templateC')]);

        await updateTemplate(template);

        expect(await getEntitiesByTemplate('templateB')).toMatchObject([
          { sharedId: 'entityB1', metadata: { rel_prop: [] } },
          { sharedId: 'entityB2', metadata: { rel_prop: [] } },
        ]);
      });

      it('should create metadata values if connections to entities with the new content (target template) exist', async () => {
        await setUpFixtures({
          ...fixtures,
          entities: [
            ...(fixtures.entities || []),
            f.entity('entityC1', 'templateC', {}, { title: 'entityC1 english', language: 'en' }),
            f.entity('entityC1', 'templateC', {}, { title: 'entityC1 spanish', language: 'es' }),
          ],
          connections: [
            ...createConnection('entityC1', 'entityB1', 'rel', 'hub1'),
            ...createConnection('entityC1', 'entityB2', 'rel', 'hub1'),
          ],
        });

        await updateTemplate(
          f.template('templateB', [
            f.relationshipProp('rel_prop', 'templateC', {
              relationType: f.idString('rel'),
            }),
          ])
        );

        const expected = [
          { sharedId: 'entityB1', metadata: { rel_prop: [{ label: 'entityC1 english' }] } },
          { sharedId: 'entityB2', metadata: { rel_prop: [{ label: 'entityC1 english' }] } },
        ];

        expect(await getEntitiesByTemplate('templateB')).toMatchObject(expected);
        expect(await getEntitiesByTemplate('templateB', 'elastic')).toMatchObject(expected);
      });
    });
    describe('when "content" (target template) is empty (any template)', () => {
      it('should create metadata values if connections to entities to any template exists', async () => {
        const hub1 = f.id('hub1');
        const hub2 = f.id('hub2');
        const hub3 = f.id('hub3');
        await setUpFixtures({
          ...fixtures,
          entities: [
            ...(fixtures.entities || []),
            f.entity('entityC1', 'templateC', {}, { title: 'entityC1 english', language: 'en' }),
            f.entity('entityC1', 'templateC', {}, { title: 'entityC1 spanish', language: 'es' }),
          ],
          connections: [
            { _id: testingDB.id(), entity: 'entityC1', template: f.idString('rel'), hub: hub1 },
            { _id: testingDB.id(), entity: 'entityB1', hub: hub1 },

            { _id: testingDB.id(), entity: 'entityC1', template: f.idString('rel'), hub: hub2 },
            { _id: testingDB.id(), entity: 'entityB2', hub: hub2 },

            { _id: testingDB.id(), entity: 'entityA1', template: f.idString('rel'), hub: hub3 },
            { _id: testingDB.id(), entity: 'entityB2', hub: hub3 },
          ],
        });

        await updateTemplate(
          f.template('templateB', [
            f.relationshipProp('rel_prop', undefined, {
              relationType: f.idString('rel'),
            }),
          ])
        );

        const expected = [
          { sharedId: 'entityB1', metadata: { rel_prop: [{ label: 'entityC1 english' }] } },

          {
            sharedId: 'entityB2',
            metadata: {
              rel_prop: [{ label: 'entityC1 english' }, { label: 'entityA1 english' }],
            },
          },
        ];

        expect(await getEntitiesByTemplate('templateB')).toMatchObject(expected);
        expect(await getEntitiesByTemplate('templateB', 'elastic')).toMatchObject(expected);
      });
    });

    describe('when "content" (target template) is empty (any template) AND ALL CONNECTIONS HAVE RelationType (even the parent)', () => {
      it('should the values created include itself ????? (this is the current behaviour)', async () => {
        await setUpFixtures({
          ...fixtures,
          entities: [
            ...(fixtures.entities || []),
            f.entity('entityC1', 'templateC', {}, { title: 'entityC1 english', language: 'en' }),
            f.entity('entityC1', 'templateC', {}, { title: 'entityC1 spanish', language: 'es' }),
          ],
          connections: [
            ...createConnection('entityC1', 'entityB1', 'rel', 'hub1'),
            ...createConnection('entityC1', 'entityB2', 'rel', 'hub2'),
            ...createConnection('entityA1', 'entityB2', 'rel', 'hub3'),
          ],
        });

        await updateTemplate(
          f.template('templateB', [
            f.relationshipProp('rel_prop', undefined, {
              relationType: f.idString('rel'),
            }),
          ])
        );

        const expected = [
          {
            sharedId: 'entityB1',
            metadata: {
              rel_prop: [{ label: 'entityC1 english' }, { label: 'entityB1 english' }],
            },
          },
          {
            sharedId: 'entityB2',
            metadata: {
              rel_prop: [
                { label: 'entityC1 english' },
                { label: 'entityB2 english' },
                { label: 'entityA1 english' },
              ],
            },
          },
        ];

        expect(await getEntitiesByTemplate('templateB')).toMatchObject(expected);
        expect(await getEntitiesByTemplate('templateB', 'elastic')).toMatchObject(expected);
      });
    });

    describe('when 2 relationships point to the same template/rel combination but different inherit props', () => {
      it('should properly dernomalize both props', async () => {
        await setUpFixtures({
          ...fixtures,
          templates: [
            ...fixtures.templates,
            f.template('templateD', [
              f.relationshipProp('rel_prop', 'templateA'),
              f.relationshipProp('rel_prop2', 'templateA'),
            ]),
          ],
          entities: [
            ...(fixtures.entities || []),
            f.entity('entityD1', 'templateD', {
              rel_prop: [f.metadataValue('entityA1', '')],
              rel_prop2: [f.metadataValue('entityA1', '')],
            }),
            f.entity('entityD2', 'templateD', {
              rel_prop: [f.metadataValue('entityA2', '')],
              rel_prop2: [f.metadataValue('entityA2', '')],
            }),
          ],
          connections: [
            ...createConnection('entityD1', 'entityA1', 'rel', 'hub1'),
            ...createConnection('entityD2', 'entityA2', 'rel', 'hub1'),
          ],
        });

        await updateTemplate(
          f.template('templateD', [
            f.relationshipProp('rel_prop', 'templateA'),
            f.relationshipProp('rel_prop2', 'templateA', {
              inherit: { property: f.idString('text_property'), type: 'text' },
            }),
          ])
        );

        const expected = [
          {
            sharedId: 'entityD1',
            metadata: {
              rel_prop: [{ label: 'entityA1 english' }],
              rel_prop2: [
                { label: 'entityA1 english', inheritedValue: [{ value: 'text value A 1' }] },
              ],
            },
          },
          {
            sharedId: 'entityD2',
            metadata: {
              rel_prop: [{ label: 'entityA2 english' }],
              rel_prop2: [
                { label: 'entityA2 english', inheritedValue: [{ value: 'text value A 2' }] },
              ],
            },
          },
        ];
        expect(await getEntitiesByTemplate('templateD')).toMatchObject(expected);
        expect(await getEntitiesByTemplate('templateD', 'elastic')).toMatchObject(expected);
      });
    });

    describe('when creating a new relationship property which have existing connections', () => {
      it('should create the metadata values on the entities and denormalize with the proper languages', async () => {
        const hub1 = f.id('hub1');
        const hub2 = f.id('hub2');

        await setUpFixtures({
          ...fixtures,
          templates: [
            ...fixtures.templates,
            f.template('templateD', [f.relationshipProp('new_rel_prop', 'templateA', {})]),
          ],
          entities: [
            ...(fixtures.entities || []),
            f.entity('entityD1', 'templateD', {}, { title: 'entityD1 english', language: 'en' }),
            f.entity('entityD1', 'templateD', {}, { title: 'entityD1 spanish', language: 'es' }),

            f.entity('entityD2', 'templateD', {}, { title: 'entityD2 english', language: 'en' }),
            f.entity('entityD2', 'templateD', {}, { title: 'entityD2 spanish', language: 'es' }),
          ],
          connections: [
            { _id: testingDB.id(), entity: 'entityA1', template: f.idString('rel'), hub: hub1 },
            { _id: testingDB.id(), entity: 'entityD1', hub: hub1 },

            { _id: testingDB.id(), entity: 'entityA2', template: f.idString('rel'), hub: hub2 },
            { _id: testingDB.id(), entity: 'entityD2', hub: hub2 },
          ],
        });

        await updateTemplate(
          f.template('templateD', [
            f.relationshipProp('new_rel_prop', 'templateA', { relationType: f.idString('rel') }),
          ])
        );

        const expectedEn = [
          {
            sharedId: 'entityD1',
            metadata: { new_rel_prop: [{ label: 'entityA1 english' }] },
          },
          {
            sharedId: 'entityD2',
            metadata: { new_rel_prop: [{ label: 'entityA2 english' }] },
          },
        ];

        expect(await getEntitiesByTemplate('templateD', 'mongo', 'en')).toMatchObject(expectedEn);
        expect(await getEntitiesByTemplate('templateD', 'elastic', 'en')).toMatchObject(expectedEn);

        const expectedEs = [
          {
            sharedId: 'entityD1',
            metadata: { new_rel_prop: [{ label: 'entityA1 spanish' }] },
          },
          {
            sharedId: 'entityD2',
            metadata: { new_rel_prop: [{ label: 'entityA2 spanish' }] },
          },
        ];

        expect(await getEntitiesByTemplate('templateD', 'mongo', 'es')).toMatchObject(expectedEs);
        expect(await getEntitiesByTemplate('templateD', 'elastic', 'es')).toMatchObject(expectedEs);
      });
    });

    describe('when denormalization happens', () => {
      it('should trigger a EntityUpdatedEvent per entity updated', async () => {
        const template = f.template('templateB', [
          f.relationshipProp('rel_prop', 'templateA', {
            relationType: f.idString('rel2'),
          }),
        ]);

        const eventData: EntityUpdatedData[] = [];
        applicationEventsBus.on(EntityUpdatedEvent, async triggeredEventData => {
          eventData.push(triggeredEventData);
        });
        await updateTemplate(template);

        const sortedEvents = eventData.sort((a, b) =>
          (a.before[0]?.sharedId || '').localeCompare(b.before[0]?.sharedId || '')
        );

        expect(sortedEvents.length).toBe(2);

        expect(sortedEvents[0].before).toMatchObject([
          {
            sharedId: 'entityB1',
            metadata: { rel_prop: [{ value: 'entityA1' }] },
            language: 'en',
          },
          {
            sharedId: 'entityB1',
            metadata: { rel_prop: [{ value: 'entityA1' }] },
            language: 'es',
          },
        ]);
        expect(sortedEvents[0].after).toMatchObject([
          {
            sharedId: 'entityB1',
            metadata: { rel_prop: [] },
            language: 'en',
          },
          {
            sharedId: 'entityB1',
            metadata: { rel_prop: [] },
            language: 'es',
          },
        ]);

        expect(sortedEvents[1].before).toMatchObject([
          {
            sharedId: 'entityB2',
            metadata: { rel_prop: [{ value: 'entityA2' }] },
            language: 'en',
          },
          {
            sharedId: 'entityB2',
            metadata: { rel_prop: [{ value: 'entityA2' }] },
            language: 'es',
          },
        ]);

        expect(sortedEvents[1].after).toMatchObject([
          {
            sharedId: 'entityB2',
            metadata: { rel_prop: [] },
            language: 'en',
          },
          {
            sharedId: 'entityB2',
            metadata: { rel_prop: [] },
            language: 'es',
          },
        ]);
      });
    });
  });

  it('should not allow updating a template that is currently being processed', async () => {
    await setUpFixtures({
      ...fixtures,
      templates: [
        f.template('templateA', [f.property('text_property')]),
        {
          ...f.template('templateB', [
            f.relationshipProp('rel_prop', 'templateA'),
            f.property('text_property_b'),
          ]),
          processing: {
            active: true,
          },
        },
        f.template('templateC', [f.property('text_property_2')]),
      ],
    });

    const propertyWithNameChanged = f.property('text_property_b', 'text', {
      label: 'name_changed',
    });

    const template = f.template('templateB', [
      f.relationshipProp('rel_prop', 'templateA'),
      propertyWithNameChanged,
    ]);

    await expect(async () =>
      testingEnvironment.runWithContext(async () => templates.save(template, 'en'))
    ).rejects.toEqual(
      new ValidationError([
        { path: 'processing', message: 'template is being processed you can not update it yet' },
      ])
    );
  });

  it('Template with 0 entities should not be in processing state', async () => {
    await setUpFixtures({
      ...fixtures,
      templates: [...fixtures.templates, f.template('templateD', [f.property('text_property_b')])],
      entities: [],
      translationsV2: [
        {
          _id: f.id('translation_text_property_b'),
          language: 'en',
          key: 'text_property_b',
          value: 'text_property_b',
          context: {
            type: 'Entity',
            label: 'text_property_b',
            id: f.idString('templateD'),
          },
        },
      ],
    });

    const propertyWithNameChanged = f.property('text_property_b', 'text', {
      label: 'name_changed',
    });

    const template = f.template('templateD', [propertyWithNameChanged]);

    await updateTemplate(template);
    const savedTemplate = await templates.getById(f.id('templateD'));
    expect(savedTemplate?.processing).toEqual({ active: false });
  });

  it('should again allow updating a template when the processing has finished', async () => {
    await setUpFixtures(fixtures);

    const propertyWithNameChanged = f.property('text_property_b', 'text', {
      label: 'name_changed',
    });
    const template = f.template('templateB', [
      f.relationshipProp('rel_prop', 'templateA'),
      propertyWithNameChanged,
    ]);

    const modifiedTemplate = f.template('templateB', [
      f.relationshipProp('rel_prop', 'templateB'),
      propertyWithNameChanged,
    ]);

    await updateTemplate(template);

    await expect(updateTemplate(modifiedTemplate)).resolves.not.toThrow();
  });

  it('should throw error when there is a mapping conflict, and not save the template', async () => {
    await setUpFixtures({
      ...fixtures,
      templates: [...fixtures.templates, f.template('templateD', [f.property('text_property_d')])],
      entities: [],
    });
    await updateTemplate(f.template('templateD', []));
    await expect(async () =>
      updateTemplate(f.template('templateD', [f.property('text_property_d', 'numeric')]))
    ).rejects.toThrow('Reason: mapper');
    const templateD = (await testingEnvironment.db.getAllFrom('templates'))?.find(
      t => t.name === 'templateD'
    );
    expect(templateD?.properties).toEqual([]);
  });

  it('should reset the index when fullReindex is passed, and reindex all entities', async () => {
    await setUpFixtures({
      ...fixtures,
      templates: [...fixtures.templates, f.template('templateD', [f.property('text_property_d')])],
      files: [
        {
          entity: 'entityA1',
          fullText: { 1: 'entityA1 full text' },
          language: 'eng',
          originalname: 'file1',
          filename: 'file1',
          type: 'document',
          mimetype: 'application/pdf',
        },
      ],
    });

    expect((await getEntitiesByTemplate('templateA', 'elastic')).length).toBe(3);
    expect((await getEntitiesByTemplate('templateB', 'elastic')).length).toBe(2);
    expect((await getEntitiesByTemplate('templateC', 'elastic')).length).toBe(0);

    await updateTemplate(f.template('templateD', []));
    await updateTemplate(f.template('templateD', [f.property('text_property_d', 'numeric')]), true);

    await elasticTesting.refresh();
    expect((await elasticTesting.getIndexedFullTextFromFiles())[0].fullText_english).toBe(
      'entityA1 full text'
    );

    expect((await getEntitiesByTemplate('templateA', 'elastic')).length).toBe(3);
    expect((await getEntitiesByTemplate('templateB', 'elastic')).length).toBe(2);
    expect((await getEntitiesByTemplate('templateC', 'elastic')).length).toBe(0);
  }, 10000);

  describe('when there is a new property with generatedId type', () => {
    it('should generate id for all entities related', async () => {
      jest.spyOn(idGenerator, 'generateID').mockImplementation(() => 'generated_id');
      jest.spyOn(setupSockets, 'emitToTenant').mockImplementation();
      const templateToUpdate = f.template('templateA', [
        { name: 'auto_id', type: propertyTypes.generatedid, label: 'Auto Id' },
      ]);

      await updateTemplate(templateToUpdate);

      const generatedIdEntities = (await testingEnvironment.db.getAllFrom('entities')).filter(
        e => e.metadata.auto_id
      );

      expect(generatedIdEntities.length).toBe(6);
      const generatedIds = generatedIdEntities.map(e => e.metadata.auto_id[0].value);
      expect(generatedIds).toEqual([
        'generated_id',
        'generated_id',
        'generated_id',
        'generated_id',
        'generated_id',
        'generated_id',
      ]);
    });
  });

  describe('fullReindex: true - ensuring entities are reindexed when adding non-relationship properties', () => {
    it('should reindex current template entities when adding text properties with fullReindex=true', async () => {
      await setUpFixtures({
        ...fixtures,
        templates: [...fixtures.templates, f.template('templateFullReindexText', [])],
        entities: [
          ...(fixtures.entities || []),
          f.entity(
            'entityFullReindexText1',
            'templateFullReindexText',
            {},
            { title: 'Text Entity 1', language: 'en' }
          ),
          f.entity(
            'entityFullReindexText2',
            'templateFullReindexText',
            {},
            { title: 'Text Entity 2', language: 'en' }
          ),
        ],
      });

      const template = f.template('templateFullReindexText', [
        f.property('new_text_field', 'text', { label: 'New Text Field' }),
      ]);

      await updateTemplate(template, true);

      const entitiesInElastic = await getEntitiesByTemplate('templateFullReindexText', 'elastic');
      expect(entitiesInElastic.length).toBe(2);
      expect(entitiesInElastic).toMatchObject([
        { sharedId: 'entityFullReindexText1', title: 'Text Entity 1' },
        { sharedId: 'entityFullReindexText2', title: 'Text Entity 2' },
      ]);
    });

    it('should reindex current template entities when adding numeric properties with fullReindex=true', async () => {
      await setUpFixtures({
        ...fixtures,
        templates: [...fixtures.templates, f.template('templateFullReindexNumeric', [])],
        entities: [
          ...(fixtures.entities || []),
          f.entity(
            'entityFullReindexNumeric1',
            'templateFullReindexNumeric',
            {},
            { title: 'Numeric Entity 1', language: 'en' }
          ),
        ],
      });

      const template = f.template('templateFullReindexNumeric', [
        f.property('new_numeric_field', 'numeric', { label: 'New Numeric Field' }),
      ]);

      await updateTemplate(template, true);

      const entitiesInElastic = await getEntitiesByTemplate(
        'templateFullReindexNumeric',
        'elastic'
      );
      expect(entitiesInElastic.length).toBe(1);
      expect(entitiesInElastic[0]).toMatchObject({
        sharedId: 'entityFullReindexNumeric1',
        title: 'Numeric Entity 1',
      });
    });

    it('should reindex current template entities when adding date properties with fullReindex=true', async () => {
      await setUpFixtures({
        ...fixtures,
        templates: [...fixtures.templates, f.template('templateFullReindexDate', [])],
        entities: [
          ...(fixtures.entities || []),
          f.entity(
            'entityFullReindexDate1',
            'templateFullReindexDate',
            {},
            { title: 'Date Entity 1', language: 'en' }
          ),
        ],
      });

      const template = f.template('templateFullReindexDate', [
        f.property('new_date_field', 'date', { label: 'New Date Field' }),
      ]);

      await updateTemplate(template, true);

      const entitiesInElastic = await getEntitiesByTemplate('templateFullReindexDate', 'elastic');
      expect(entitiesInElastic.length).toBe(1);
      expect(entitiesInElastic[0]).toMatchObject({
        sharedId: 'entityFullReindexDate1',
        title: 'Date Entity 1',
      });
    });

    it('should reindex current template with multiple entities when adding multiple properties with fullReindex=true', async () => {
      await setUpFixtures({
        ...fixtures,
        templates: [...fixtures.templates, f.template('templateFullReindexMultiple', [])],
        entities: [
          ...(fixtures.entities || []),
          f.entity(
            'entityFullReindexMultiple1',
            'templateFullReindexMultiple',
            {},
            { title: 'Multiple Entity 1', language: 'en' }
          ),
          f.entity(
            'entityFullReindexMultiple2',
            'templateFullReindexMultiple',
            {},
            { title: 'Multiple Entity 2', language: 'en' }
          ),
          f.entity(
            'entityFullReindexMultiple3',
            'templateFullReindexMultiple',
            {},
            { title: 'Multiple Entity 3', language: 'en' }
          ),
        ],
      });

      const template = f.template('templateFullReindexMultiple', [
        f.property('new_text', 'text', { label: 'New Text' }),
        f.property('new_numeric', 'numeric', { label: 'New Numeric' }),
        f.property('new_date', 'date', { label: 'New Date' }),
        f.property('new_markdown', 'markdown', { label: 'New Markdown' }),
      ]);

      await updateTemplate(template, true);

      const entitiesInElastic = await getEntitiesByTemplate(
        'templateFullReindexMultiple',
        'elastic'
      );
      expect(entitiesInElastic.length).toBe(3);
      expect(entitiesInElastic).toMatchObject([
        { sharedId: 'entityFullReindexMultiple1', title: 'Multiple Entity 1' },
        { sharedId: 'entityFullReindexMultiple2', title: 'Multiple Entity 2' },
        { sharedId: 'entityFullReindexMultiple3', title: 'Multiple Entity 3' },
      ]);
    });
  });
});
