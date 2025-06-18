import { testingEnvironment } from 'api/utils/testingEnvironment';

import entities from 'api/entities/entities.js';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import testingDB, { DBFixture } from 'api/utils/testing_db';
import { EntitySchema } from 'shared/types/entityType';
import templates from '../templates';

const f = getFixturesFactory();

async function setUpFixtures(fixtures: DBFixture) {
  await testingEnvironment.setUp(fixtures, 'templates_denorm_flow');
  try {
    await Promise.all(
      (fixtures.entities || []).map(async e => entities.save(e, { language: 'en', user: {} }))
    );
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
    throw e;
  }
}
describe('templates denormalization scenarios', () => {
  let fixtures: DBFixture = {};
  beforeAll(async () => {
    fixtures = {
      settings: [
        {
          languages: [
            { key: 'en', label: 'English', default: true },
            { key: 'es', label: 'Spanish' },
          ],
        },
      ],
      relationtypes: [f.relationType('rel1'), f.relationType('rel2')],
      templates: [
        f.template('templateA', [f.property('text_property')]),
        f.template('templateB', [f.relationshipProp('rel_prop', 'templateA')]),
        f.template('templateC', [f.property('text_property_2')]),
      ],
      entities: [
        ...f.entityInMultipleLanguages(['en', 'es'], 'entityA1', 'templateA', {
          text_property: [f.metadataValue('text value A 1')],
        }),
        ...f.entityInMultipleLanguages(['en', 'es'], 'entityA2', 'templateA', {
          text_property: [f.metadataValue('text value A 2')],
        }),
        ...f.entityInMultipleLanguages(['en', 'es'], 'entityB1', 'templateB', {
          rel_prop: [f.metadataValue('entityA1', '')],
        }),
        ...f.entityInMultipleLanguages(['en', 'es'], 'entityB2', 'templateB', {
          rel_prop: [f.metadataValue('entityA2', '')],
        }),
      ],
    };
    await setUpFixtures(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('when changing a relationship property "inherit.property"', () => {
    it('should denormalize the new inherited property', async () => {
      const template = f.template('templateB', [
        f.relationshipProp('rel_prop', 'templateA', {
          inherit: { property: f.idString('text_property'), type: 'text' },
        }),
      ]);

      await templates.save(template, 'en');

      const dbEntities = (await testingEnvironment.db.getAllFrom('entities'))?.filter(
        (entity: EntitySchema) => entity.template?.toString() === f.idString('templateB')
      );
      expect(dbEntities).toMatchObject([
        {
          sharedId: 'entityB1',
          language: 'en',
          metadata: { rel_prop: [{ inheritedValue: [{ value: 'text value A 1' }] }] },
        },
        {
          sharedId: 'entityB1',
          language: 'es',
          metadata: { rel_prop: [{ inheritedValue: [{ value: 'text value A 1' }] }] },
        },
        {
          sharedId: 'entityB2',
          language: 'en',
          metadata: { rel_prop: [{ inheritedValue: [{ value: 'text value A 2' }] }] },
        },
        {
          sharedId: 'entityB2',
          language: 'es',
          metadata: { rel_prop: [{ inheritedValue: [{ value: 'text value A 2' }] }] },
        },
      ]);
    });
  });

  describe('when changing a relationship property "relationType"', () => {
    it('should delete values belonging to the previous relationType', async () => {
      const template = f.template('templateB', [
        f.relationshipProp('rel_prop', 'templateA', {
          relationType: f.idString('rel2'),
        }),
      ]);

      await templates.save(template, 'en');

      const dbEntities = (await testingEnvironment.db.getAllFrom('entities'))?.filter(
        (entity: EntitySchema) => entity.template?.toString() === f.idString('templateB')
      );

      expect(dbEntities).toMatchObject([
        { sharedId: 'entityB1', language: 'en', metadata: { rel_prop: [] } },
        { sharedId: 'entityB1', language: 'es', metadata: { rel_prop: [] } },
        { sharedId: 'entityB2', language: 'en', metadata: { rel_prop: [] } },
        { sharedId: 'entityB2', language: 'es', metadata: { rel_prop: [] } },
      ]);
    });

    it('should create values if connections with the new relationType exist', async () => {
      const hub1 = f.id('hub1');
      await setUpFixtures({
        ...fixtures,
        entities: [
          ...(fixtures.entities || []),
          ...f.entityInMultipleLanguages(['en', 'es'], 'entityA3', 'templateA', {}),
        ],
        connections: [
          { _id: testingDB.id(), entity: 'entityB1', template: f.idString('rel2'), hub: hub1 },
          { _id: testingDB.id(), entity: 'entityA3', template: f.idString('rel2'), hub: hub1 },
        ],
      });
      const template = f.template('templateB', [
        f.relationshipProp('rel_prop', 'templateA', {
          relationType: f.idString('rel2'),
        }),
      ]);

      await templates.save(template, 'en');

      const dbEntities = (await testingEnvironment.db.getAllFrom('entities'))?.filter(
        (entity: EntitySchema) => entity.template?.toString() === f.idString('templateB')
      );

      expect(dbEntities).toMatchObject([
        { sharedId: 'entityB1', language: 'en', metadata: { rel_prop: [{ label: 'entityA3' }] } },
        { sharedId: 'entityB1', language: 'es', metadata: { rel_prop: [{ label: 'entityA3' }] } },
        { sharedId: 'entityB2', language: 'en', metadata: { rel_prop: [] } },
        { sharedId: 'entityB2', language: 'es', metadata: { rel_prop: [] } },
      ]);
    });
  });

  describe('when changing a relationship property "content" (target template)', () => {
    it('should delete values belonging to the previous content', async () => {
      const template = f.template('templateB', [f.relationshipProp('rel_prop', 'templateC')]);

      await templates.save(template, 'en');

      const dbEntities = (await testingEnvironment.db.getAllFrom('entities'))?.filter(
        (entity: EntitySchema) => entity.template?.toString() === f.idString('templateB')
      );

      expect(dbEntities).toMatchObject([
        { sharedId: 'entityB1', language: 'en', metadata: { rel_prop: [] } },
        { sharedId: 'entityB1', language: 'es', metadata: { rel_prop: [] } },
        { sharedId: 'entityB2', language: 'en', metadata: { rel_prop: [] } },
        { sharedId: 'entityB2', language: 'es', metadata: { rel_prop: [] } },
      ]);
    });

    it('should create values if connections to entities with the new content (target template) exist', async () => {
      const hub1 = f.id('hub1');
      await setUpFixtures({
        ...fixtures,
        entities: [
          ...(fixtures.entities || []),
          ...f.entityInMultipleLanguages(['en', 'es'], 'entityC1', 'templateC', {}),
        ],
        connections: [
          { _id: testingDB.id(), entity: 'entityC1', template: f.idString('rel'), hub: hub1 },
          { _id: testingDB.id(), entity: 'entityB1', template: f.idString('rel'), hub: hub1 },

          { _id: testingDB.id(), entity: 'entityC1', template: f.idString('rel'), hub: hub1 },
          { _id: testingDB.id(), entity: 'entityB2', template: f.idString('rel'), hub: hub1 },
        ],
      });

      await templates.save(
        f.template('templateB', [
          f.relationshipProp('rel_prop', 'templateC', {
            relationType: f.idString('rel'),
          }),
        ]),
        'en'
      );

      const dbEntities = (await testingEnvironment.db.getAllFrom('entities'))?.filter(
        (entity: EntitySchema) => entity.template?.toString() === f.idString('templateB')
      );

      expect(dbEntities).toMatchObject([
        { sharedId: 'entityB1', language: 'en', metadata: { rel_prop: [{ label: 'entityC1' }] } },
        { sharedId: 'entityB1', language: 'es', metadata: { rel_prop: [{ label: 'entityC1' }] } },
        { sharedId: 'entityB2', language: 'en', metadata: { rel_prop: [{ label: 'entityC1' }] } },
        { sharedId: 'entityB2', language: 'es', metadata: { rel_prop: [{ label: 'entityC1' }] } },
      ]);
    });

    describe('when "content" (target template) is empty (any template)', () => {
      xit('should create values if connections to entities to any template exists', async () => {
        const hub1 = f.id('hub1');
        const hub2 = f.id('hub2');
        const hub3 = f.id('hub3');
        await setUpFixtures({
          ...fixtures,
          entities: [
            ...(fixtures.entities || []),
            ...f.entityInMultipleLanguages(['en', 'es'], 'entityC1', 'templateC', {}),
          ],
          connections: [
            { _id: testingDB.id(), entity: 'entityC1', template: f.idString('rel'), hub: hub1 },
            { _id: testingDB.id(), entity: 'entityB1', template: f.idString('rel'), hub: hub1 },

            { _id: testingDB.id(), entity: 'entityC1', template: f.idString('rel'), hub: hub2 },
            { _id: testingDB.id(), entity: 'entityB2', template: f.idString('rel'), hub: hub2 },

            { _id: testingDB.id(), entity: 'entityA1', template: f.idString('rel'), hub: hub3 },
            { _id: testingDB.id(), entity: 'entityB2', template: f.idString('rel'), hub: hub3 },
          ],
        });

        await templates.save(
          f.template('templateB', [
            f.relationshipProp('rel_prop', undefined, {
              relationType: f.idString('rel'),
            }),
          ]),
          'en'
        );

        const dbEntities = (await testingEnvironment.db.getAllFrom('entities'))?.filter(
          (entity: EntitySchema) => entity.template?.toString() === f.idString('templateB')
        );

        expect(dbEntities).toMatchObject([
          { sharedId: 'entityB1', language: 'en', metadata: { rel_prop: [{ label: 'entityC1' }] } },
          { sharedId: 'entityB1', language: 'es', metadata: { rel_prop: [{ label: 'entityC1' }] } },
          { sharedId: 'entityB2', language: 'en', metadata: { rel_prop: [{ label: 'entityC1' }] } },
          { sharedId: 'entityB2', language: 'es', metadata: { rel_prop: [{ label: 'entityC1' }] } },
        ]);
      });
    });
  });
});
