import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { elasticTesting } from '#api/utils/elastic_testing.js';
import { PostgresEntitiesDAOFactory } from '#api/core/infrastructure/factories/PostgresEntitiesDAOFactory.js';
import { search } from '../search.js';

const factory = getFixturesFactory({ convertIdToString: true });

// Every entity gets the same explicit icon/published/dates/permissions so the two
// backends stay comparable on those fields. Mongo fixtures are inserted via raw
// `insertMany` (no schema defaults applied) and mirrored as-is into Postgres
// (`testingEnvironment.setFixtures`), so any field left unset here comes back present
// (with a column default) from Postgres but absent from Mongo - a key-presence mismatch
// unrelated to the query-shape parity this suite targets. This suite cannot exercise the
// icon *default* (finding #3) either way - see
// plans/fix-postgres-entities-search-parity.md, Step 4, "Icon note".
const commonProps = {
  icon: { _id: 'icon1', label: 'Icon', type: 'Custom' },
  published: false,
  creationDate: 0,
  editDate: 0,
  permissions: [],
};

const fixtures = {
  templates: [
    factory.template('t1', []),
    factory.template('t2', [factory.relationshipProp('relationship', 't1')]),
    factory.template('t3', [factory.relationshipProp('reference', 't1')]),
  ],
  entities: [
    ...factory.entityInMultipleLanguages(['en', 'es'], 'a1', 't1', {}, commonProps, {
      en: { title: 'A One EN' },
      es: { title: 'A One ES' },
    }),
    ...factory.entityInMultipleLanguages(['en', 'es'], 'a2', 't1', {}, commonProps, {
      en: { title: 'A Two EN' },
      es: { title: 'A Two ES' },
    }),
    ...factory.entityInMultipleLanguages(
      ['en', 'es'],
      'b1',
      't2',
      { relationship: [factory.metadataValue('a1')] },
      commonProps,
      { en: { title: 'B One EN' }, es: { title: 'B One ES' } }
    ),
    ...factory.entityInMultipleLanguages(
      ['en', 'es'],
      'b2',
      't2',
      { relationship: [factory.metadataValue('a2')] },
      commonProps,
      { en: { title: 'B Two EN' }, es: { title: 'B Two ES' } }
    ),
    factory.entity(
      'b3',
      't2',
      { relationship: [factory.metadataValue('a1'), factory.metadataValue('a2')] },
      { ...commonProps, title: 'B Three EN' }
    ),
    factory.entity(
      'c1',
      't3',
      { reference: [factory.metadataValue('a2')] },
      { ...commonProps, title: 'C One EN' }
    ),
  ],
};

type QueryShape = {
  name: string;
  query: Record<string, unknown>;
};

const queryShapes: QueryShape[] = [
  { name: '{} (full reindex)', query: {} },
  { name: '{ sharedId }', query: { sharedId: 'b1' } },
  { name: '{ sharedId: { $in } }', query: { sharedId: { $in: ['a1', 'b2'] } } },
  { name: '{ _id }', query: { _id: factory.idString('b3-en') } },
  {
    name: '{ _id: { $in } }',
    query: { _id: { $in: [factory.idString('b3-en'), factory.idString('c1-en')] } },
  },
  { name: '{ language }', query: { language: 'es' } },
  {
    name: '{ $and: [...], $or: [...] } (dynamic metadata path, denormalize.ts shape)',
    query: {
      $and: [
        { language: 'en' },
        {
          $or: [{ 'metadata.relationship.value': 'a2' }, { 'metadata.reference.value': 'a2' }],
        },
      ],
    },
  },
];

describe('indexEntities parity: Mongo vs Postgres', () => {
  const elasticIndex = 'index_for_index_entities_parity_testing';

  beforeAll(async () => {
    await testingEnvironment.setUp({}, { elasticIndex, postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  const collectIndexed = async (usePostgres: boolean, query: Record<string, unknown>) => {
    testingTenants.changeCurrentTenant({
      featureFlags: { postgresEntities: usePostgres, postgresFiles: usePostgres },
    });
    await testingEnvironment.setFixtures(fixtures);
    await elasticTesting.resetIndex();
    await testingEnvironment.runWithContext(async () => search.indexEntities(query));
    await elasticTesting.refresh();
    return elasticTesting.getIndexedEntities();
  };

  it.each(queryShapes)('produces the same indexed result for $name', async ({ query }) => {
    const mongoResult = await collectIndexed(false, query);
    const postgresResult = await collectIndexed(true, query);

    expect(postgresResult).toEqual(mongoResult);
  });

  it('PostgresEntitiesDAOFactory throws when postgresEntities is on but postgresFiles is off', async () => {
    testingTenants.changeCurrentTenant({
      featureFlags: { postgresEntities: true, postgresFiles: false },
    });

    expect(() =>
      testingEnvironment.runWithContext(() => PostgresEntitiesDAOFactory.default())
    ).toThrow();
  });

  it('rejects an unrecognized query shape under Postgres instead of silently sweeping the tenant', async () => {
    testingTenants.changeCurrentTenant({
      featureFlags: { postgresEntities: true, postgresFiles: true },
    });
    await testingEnvironment.setFixtures(fixtures);
    await elasticTesting.resetIndex();

    await expect(
      testingEnvironment.runWithContext(async () => search.indexEntities({ obsoleteField: 'x' }))
    ).rejects.toThrow();
  });
});
