import entities from 'api/entities/entities.js';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import testingDB, { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { testingTenants } from 'api/utils/testingTenants';
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
    console.error(e);
    throw e;
  }
}

const getEntitiesByTemplate = async (templateId: string): Promise<EntitySchema[]> => {
  const allEntities = await testingEnvironment.db.getAllFrom('entities');
  return (
    allEntities?.filter(entity => entity.template?.toString() === f.idString(templateId)) || []
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

describe.each([
  { featureFlag: false },
  //  { featureFlag: true }
])('templates denormalization scenarios (feature flag -> $featureFlag)', ({ featureFlag }) => {
  let fixtures: DBFixture;

  beforeAll(async () => {
    fixtures = {
      settings: [{ languages: [{ key: 'en', label: 'English', default: true }] }],
      relationtypes: [f.relationType('rel1'), f.relationType('rel2')],
      templates: [
        f.template('templateA', [f.property('text_property')]),
        f.template('templateB', [f.relationshipProp('rel_prop', 'templateA')]),
        f.template('templateC', [f.property('text_property_2')]),
      ],
      entities: [
        f.entity('entityA1', 'templateA', {
          text_property: [f.metadataValue('text value A 1')],
        }),
        f.entity('entityA2', 'templateA', {
          text_property: [f.metadataValue('text value A 2')],
        }),
        f.entity('entityB1', 'templateB', {
          rel_prop: [f.metadataValue('entityA1', '')],
        }),
        f.entity('entityB2', 'templateB', {
          rel_prop: [f.metadataValue('entityA2', '')],
        }),
      ],
    };
    await setUpFixtures(fixtures);
    testingTenants.changeCurrentTenant({
      featureFlags: { templatesDenormalizationPerfImprovements: featureFlag },
    });
  });

  describe('when changing a relationship property "inherit"', () => {
    it('should correctly inherit and denormalize properties from related templates', async () => {
      const template = f.template('templateB', [
        f.relationshipProp('rel_prop', 'templateA', {
          inherit: { property: f.idString('text_property'), type: 'text' },
        }),
      ]);

      await templates.save(template, 'en');

      expect(await getEntitiesByTemplate('templateB')).toMatchObject([
        {
          sharedId: 'entityB1',
          metadata: { rel_prop: [{ inheritedValue: [{ value: 'text value A 1' }] }] },
        },
        {
          sharedId: 'entityB2',
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

      expect(await getEntitiesByTemplate('templateB')).toMatchObject([
        { sharedId: 'entityB1', metadata: { rel_prop: [] } },
        { sharedId: 'entityB2', metadata: { rel_prop: [] } },
      ]);
    });

    it('should create metadata values if connections with the new relationType exist', async () => {
      await setUpFixtures({
        ...fixtures,
        entities: [...(fixtures.entities || []), f.entity('entityA3', 'templateA', {})],
        connections: [...createConnection('entityB1', 'entityA3', 'rel2', 'hub1')],
      });

      const template = f.template('templateB', [
        f.relationshipProp('rel_prop', 'templateA', {
          relationType: f.idString('rel2'),
        }),
      ]);

      await templates.save(template, 'en');

      expect(await getEntitiesByTemplate('templateB')).toMatchObject([
        { sharedId: 'entityB1', metadata: { rel_prop: [{ label: 'entityA3' }] } },
        { sharedId: 'entityB2', metadata: { rel_prop: [] } },
      ]);
    });
  });

  describe('when changing a relationship property "content" (target template)', () => {
    it('should delete values belonging to the previous content', async () => {
      const template = f.template('templateB', [f.relationshipProp('rel_prop', 'templateC')]);

      await templates.save(template, 'en');

      expect(await getEntitiesByTemplate('templateB')).toMatchObject([
        { sharedId: 'entityB1', metadata: { rel_prop: [] } },
        { sharedId: 'entityB2', metadata: { rel_prop: [] } },
      ]);
    });

    it('should create metadata values if connections to entities with the new content (target template) exist', async () => {
      await setUpFixtures({
        ...fixtures,
        entities: [...(fixtures.entities || []), f.entity('entityC1', 'templateC', {})],
        connections: [
          ...createConnection('entityC1', 'entityB1', 'rel', 'hub1'),
          ...createConnection('entityC1', 'entityB2', 'rel', 'hub1'),
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

      expect(await getEntitiesByTemplate('templateB')).toMatchObject([
        { sharedId: 'entityB1', metadata: { rel_prop: [{ label: 'entityC1' }] } },
        { sharedId: 'entityB2', metadata: { rel_prop: [{ label: 'entityC1' }] } },
      ]);
    });
  });
  describe('when "content" (target template) is empty (any template)', () => {
    it('should create metadata values if connections to entities to any template exists', async () => {
      const hub1 = f.id('hub1');
      const hub2 = f.id('hub2');
      const hub3 = f.id('hub3');
      await setUpFixtures({
        ...fixtures,
        entities: [...(fixtures.entities || []), f.entity('entityC1', 'templateC', {})],
        connections: [
          { _id: testingDB.id(), entity: 'entityC1', template: f.idString('rel'), hub: hub1 },
          { _id: testingDB.id(), entity: 'entityB1', hub: hub1 },

          { _id: testingDB.id(), entity: 'entityC1', template: f.idString('rel'), hub: hub2 },
          { _id: testingDB.id(), entity: 'entityB2', hub: hub2 },

          { _id: testingDB.id(), entity: 'entityA1', template: f.idString('rel'), hub: hub3 },
          { _id: testingDB.id(), entity: 'entityB2', hub: hub3 },
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

      expect(await getEntitiesByTemplate('templateB')).toMatchObject([
        { sharedId: 'entityB1', metadata: { rel_prop: [{ label: 'entityC1' }] } },

        {
          sharedId: 'entityB2',
          metadata: { rel_prop: [{ label: 'entityC1' }, { label: 'entityA1' }] },
        },
      ]);
    });
  });

  describe('when "content" (target template) is empty (any template) AND ALL CONNECTIONS HAVE RelationType (even the parent)', () => {
    it('should the values created include itself ????? (this is the current behaviour)', async () => {
      await setUpFixtures({
        ...fixtures,
        entities: [...(fixtures.entities || []), f.entity('entityC1', 'templateC', {})],
        connections: [
          ...createConnection('entityC1', 'entityB1', 'rel', 'hub1'),
          ...createConnection('entityC1', 'entityB2', 'rel', 'hub2'),
          ...createConnection('entityA1', 'entityB2', 'rel', 'hub3'),
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

      expect(await getEntitiesByTemplate('templateB')).toMatchObject([
        {
          sharedId: 'entityB1',
          metadata: { rel_prop: [{ label: 'entityC1' }, { label: 'entityB1' }] },
        },
        {
          sharedId: 'entityB2',
          metadata: {
            rel_prop: [{ label: 'entityC1' }, { label: 'entityB2' }, { label: 'entityA1' }],
          },
        },
      ]);
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

      await templates.save(
        f.template('templateD', [
          f.relationshipProp('rel_prop', 'templateA'),
          f.relationshipProp('rel_prop2', 'templateA', {
            inherit: { property: f.idString('text_property'), type: 'text' },
          }),
        ]),
        'en'
      );

      expect(await getEntitiesByTemplate('templateD')).toMatchObject([
        {
          sharedId: 'entityD1',
          metadata: {
            rel_prop: [{ label: 'entityA1' }],
            rel_prop2: [{ label: 'entityA1', inheritedValue: [{ value: 'text value A 1' }] }],
          },
        },
        {
          sharedId: 'entityD2',
          metadata: {
            rel_prop: [{ label: 'entityA2' }],
            rel_prop2: [{ label: 'entityA2', inheritedValue: [{ value: 'text value A 2' }] }],
          },
        },
      ]);
    });
  });

  describe('when creating a new relationship property', () => {
    it('should create metadata values if connections to entities exists', async () => {
      await setUpFixtures({
        ...fixtures,
        templates: [...fixtures.templates, f.template('templateD')],
        entities: [
          ...(fixtures.entities || []),
          f.entity('entityD1', 'templateD', {}),
          f.entity('entityD2', 'templateD', {}),
        ],
        connections: [
          ...createConnection('entityD1', 'entityA1', 'rel', 'hub1'),
          ...createConnection('entityD2', 'entityA2', 'rel', 'hub2'),
        ],
      });

      await templates.save(
        f.template('templateD', [
          f.relationshipProp('new_rel_prop', 'templateA', { relationType: f.idString('rel') }),
          f.relationshipProp('new_rel_prop2', 'templateA', {
            relationType: f.idString('rel'),
            inherit: { property: f.idString('text_property'), type: 'text' },
          }),
        ]),
        'en'
      );

      expect(await getEntitiesByTemplate('templateD')).toMatchObject([
        {
          sharedId: 'entityD1',
          metadata: {
            new_rel_prop: [{ label: 'entityA1' }],
            new_rel_prop2: [{ label: 'entityA1', inheritedValue: [{ value: 'text value A 1' }] }],
          },
        },
        {
          sharedId: 'entityD2',
          metadata: {
            new_rel_prop: [{ label: 'entityA2' }],
            new_rel_prop2: [{ label: 'entityA2', inheritedValue: [{ value: 'text value A 2' }] }],
          },
        },
      ]);
    });
  });
});
