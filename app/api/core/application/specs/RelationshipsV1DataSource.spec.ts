/* eslint-disable max-lines */
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { RelationshipsV1DataSourceFactory } from '#api/core/infrastructure/factories/RelationshipsV1DataSourceFactory.js';
import type { RelationshipsV1DataSource } from '#shared/contracts/RelationshipsV1DataSource.js';

const factory = getFixturesFactory();

const fixtures: DBFixture = {
  settings: [
    {
      languages: [{ default: true, key: 'en', label: 'English' }],
    },
  ],
  relationtypes: [factory.relationType('rel1')],
  templates: [
    factory.template('templateA', [factory.relationshipProp('rel_to_B', 'templateB')]),
    factory.template('templateB', [factory.property('text', 'text')]),
  ],
  entities: [
    factory.entity('A', 'templateA', {}),
    factory.entity('B', 'templateB', {}),
    factory.entity('C', 'templateB', {}),
  ],
  connections: [
    ...factory.hub('hub1', 'A', [
      { entity: 'B', template: 'rel1' },
      { entity: 'C', template: 'rel1' },
    ]),
    ...factory.hub('hub2', 'A', [{ entity: 'B', template: null }]),
  ],
};

type TestConfig = { name: string; postgresCore: boolean };

const testConfigs: TestConfig[] = [
  { name: 'Mongo', postgresCore: false },
  { name: 'Postgres', postgresCore: true },
];

const sorted = (ids: unknown[]) => ids.map(id => String(id)).sort();

describe('RelationshipsV1DataSource', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures, { postgres: true });
  });

  beforeEach(async () => {
    await testingEnvironment.setFixtures(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(testConfigs)('$name', ({ postgresCore }) => {
    beforeEach(() => {
      testingTenants.changeCurrentTenant({ featureFlags: { postgresCore } });
    });

    const createSut = (): RelationshipsV1DataSource =>
      testingEnvironment.runWithContext(
        () => RelationshipsV1DataSourceFactory.default(),
        postgresCore
          ? { tenant: { ...testingTenants.current(), featureFlags: { postgresCore: true } } }
          : {}
      );

    const storedConnections = async () => testingEnvironment.db.getAllFrom('connections');

    it('finds connections by hub', async () => {
      const sut = createSut();

      const rows = await sut.find({ hub: factory.idString('hub1') });

      expect(sorted(rows.map(row => row.entity))).toEqual(sorted(['A', 'B', 'C']));
    });

    it('finds a single connection by id', async () => {
      const sut = createSut();

      const row = await sut.findById(factory.idString('hub1-1'));

      expect(row?.entity).toBe('A');
      expect(row?.hub.toString()).toBe(factory.idString('hub1'));
    });

    it('counts connections by template', async () => {
      const sut = createSut();

      await expect(sut.count({ template: factory.idString('rel1') })).resolves.toBe(2);
    });

    it('returns all hub connections for an entity', async () => {
      const sut = createSut();

      const rows = await sut.getHubConnections(['A']);

      expect(sorted(rows.map(row => row.entity))).toEqual(sorted(['A', 'A', 'B', 'B', 'C']));
    });

    it('returns no hub connections when onlyTextReferences is set without a file', async () => {
      const sut = createSut();

      await expect(sut.getHubConnections(['A'], { onlyTextReferences: true })).resolves.toEqual([]);
    });

    it('returns the hub connections of a specific file when onlyTextReferences is set', async () => {
      const sut = createSut();
      await sut.saveMultiple([
        { entity: 'A', hub: factory.id('hub3'), template: null, file: 'file1' },
        { entity: 'B', hub: factory.id('hub3'), template: factory.id('rel1') },
      ]);

      const rows = await sut.getHubConnections(['A'], { file: 'file1', onlyTextReferences: true });

      expect(sorted(rows.map(row => row.entity))).toEqual(sorted(['A', 'B']));
    });

    it('returns string-id hub connections for the query service', async () => {
      const sut = createSut();

      const rows = await sut.getHubConnectionsForEntity('A');

      expect(sorted(rows.map(row => row.hub))).toEqual(
        sorted([
          factory.idString('hub1'),
          factory.idString('hub1'),
          factory.idString('hub1'),
          factory.idString('hub2'),
          factory.idString('hub2'),
        ])
      );
      expect(rows.every(row => typeof row._id === 'string')).toBe(true);
    });

    it('attaches connected entity data through getByEntitySharedIds', async () => {
      const sut = createSut();

      const relations = await sut.getByEntitySharedIds(['B']);

      expect(relations).toHaveLength(5);
      expect(relations.every(relation => typeof relation.entityData.title === 'string')).toBe(true);
    });

    it('reads metadata relationships scoped to the referenced shared ids', async () => {
      const sut = createSut();
      const sourceEntity = {
        sharedId: 'A',
        getReferencedRelationshipEntitySharedIds: () => new Set(['B']),
      };

      const relations = await sut.getEntityMetadataRelationships(sourceEntity, 'en', true);

      expect(relations).toHaveLength(2);
      expect(relations.every(relation => relation.entity === 'B')).toBe(true);
    });

    it('saves new relationships', async () => {
      const sut = createSut();

      const saved = await sut.saveMultiple([
        {
          entity: 'D',
          hub: factory.id('hub3'),
          template: factory.id('rel1'),
        },
      ]);

      expect(saved).toHaveLength(1);
      expect(saved[0].entity).toBe('D');

      const stored = await storedConnections();
      expect(stored.some(row => row.entity === 'D')).toBe(true);
    });

    it('deletes relationships and cleans up singleton hubs', async () => {
      const sut = createSut();

      await sut.delete({ _id: factory.idString('hub2-1') });

      const stored = await storedConnections();
      const hub2Rows = stored.filter(row => String(row.hub) === factory.idString('hub2'));
      expect(hub2Rows).toHaveLength(0);

      const hub1Rows = stored.filter(row => String(row.hub) === factory.idString('hub1'));
      expect(hub1Rows).toHaveLength(3);
    });

    it('bulk deletes relationships by shared ids', async () => {
      const sut = createSut();

      await sut.bulkDeleteBySharedId(['B']);

      const stored = await storedConnections();
      expect(stored.some(row => row.entity === 'B')).toBe(false);
    });

    it('builds entity references by relationship type', async () => {
      const sut = createSut();

      const references = await sut.getEntityReferencesByRelationshipTypes('A', [
        factory.idString('rel1'),
      ]);

      const rel1Id = factory.idString('rel1');
      expect(Object.keys(references)).toEqual([rel1Id]);
      expect(Object.keys(references[rel1Id]).sort()).toEqual(['B', 'C']);
      expect(references[rel1Id].B.rightSide.entity).toBe('B');
    });

    it('guesses a relationship property hub with exactly one candidate template', async () => {
      const sut = createSut();

      const candidates = await sut.guessRelationshipPropertyHub('A', factory.idString('rel1'));

      expect(candidates).toEqual([
        { _id: factory.idString('hub1'), templates: [factory.idString('rel1')] },
      ]);
    });

    it('returns right side connections', async () => {
      const sut = createSut();

      const rows = await sut.getRightSideConnections('A', [factory.idString('rel1')]);

      expect(sorted(rows.map(row => row.entity))).toEqual(sorted(['B', 'C']));
    });

    it('counts matching hubs and returns hubs for search', async () => {
      const sut = createSut();

      const total = await sut.getMatchingHubsCount('A', ['B', 'C'], []);
      expect(total).toBe(2);

      const hubs = await sut.getHubsForSearch('A', [], ['B', 'C'], 10);
      expect(hubs).toHaveLength(2);
      expect(sorted(hubs.map(hub => hub.hub))).toEqual(
        sorted([factory.idString('hub1'), factory.idString('hub2')])
      );
    });

    it('lists entities affected by hubs and hubs to delete', async () => {
      const sut = createSut();

      await expect(sut.getEntitiesAffectedByHubs([factory.idString('hub1')])).resolves.toEqual(
        expect.arrayContaining(['A', 'B', 'C'])
      );

      await expect(sut.getHubsToDelete([factory.idString('hub1')])).resolves.toEqual([]);

      const [saved] = await sut.saveMultiple([
        { entity: 'A', hub: factory.id('hub3'), template: null },
      ]);
      await expect(sut.getHubsToDelete([saved.hub.toString()])).resolves.toEqual([
        saved.hub.toString(),
      ]);
    });
  });
});
