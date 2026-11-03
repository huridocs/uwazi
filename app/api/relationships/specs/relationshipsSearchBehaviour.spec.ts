import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingDB, DBFixture } from '#api/utils/testing_db.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import relationships from '../relationships.js';

const factory = getFixturesFactory();

const settings = [
  { _id: testingDB.id(), languages: [{ key: 'en', label: 'english', default: true }] },
];
const templates = [factory.template('templateA'), factory.template('templateB')];
const relationtypes = [
  factory.relationType('rel1'),
  factory.relationType('rel2'),
  factory.relationType('rel3'),
];

const entity = (sharedId: string, template: string, title: string = sharedId) =>
  factory.entity(sharedId, template, {}, { language: 'en', title, published: true });

const filterFor = (relationType: string, template: string) => ({
  [factory.idString(relationType)]: [factory.idString(relationType) + factory.idString(template)],
});

type SearchRow = { sharedId: string; connections: { hub: { toString(): string } }[] };
type SearchResult = {
  totalHubs: number;
  totalRows: number;
  requestedHubs: number;
  rows: SearchRow[];
};

const search = async (query: object): Promise<SearchResult> =>
  testingEnvironment.runWithContext(async () => relationships.search('center', query, 'en', {}));

const hubsOf = (result: SearchResult, sharedId: string) =>
  (result.rows.find(row => row.sharedId === sharedId)?.connections || [])
    .map(connection => connection.hub.toString())
    .sort();

const hubIds = (...names: string[]) => names.map(name => factory.idString(name)).sort();

type TestConfig = { name: string; postgresCore: boolean };

const testConfigs: TestConfig[] = [
  { name: 'Mongo', postgresCore: false },
  { name: 'Postgres', postgresCore: true },
];

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe.each(testConfigs)('relationships search behaviour ($name)', ({ postgresCore }) => {
  const setUp = async (fixtures: Partial<DBFixture>) => {
    await testingEnvironment.setUp(
      { settings, templates, relationtypes, ...fixtures },
      { elasticIndex: 'relationships_search_behaviour', postgres: true }
    );
    testingTenants.changeCurrentTenant({ featureFlags: { postgresCore } });
  };

  it('should return the first `limit` hubs in search sort order when there is no filter', async () => {
    await setUp({
      entities: [
        entity('center', 'templateA'),
        entity('a1', 'templateA', 'alpha one'),
        entity('a2', 'templateA', 'alpha two'),
        entity('b1', 'templateB', 'beta one'),
        entity('b2', 'templateB', 'beta two'),
      ],
      connections: [
        ...factory.hub('hub1', 'center', [{ entity: 'b2', template: 'rel1' }]),
        ...factory.hub('hub2', 'center', [{ entity: 'a1', template: 'rel1' }]),
        ...factory.hub('hub3', 'center', [{ entity: 'a2', template: 'rel1' }]),
        ...factory.hub('hub4', 'center', [{ entity: 'b1', template: 'rel1' }]),
      ],
    });

    const result = await search({ sort: 'title', order: 'asc', limit: 2 });

    expect(result).toMatchObject({ totalHubs: 4, totalRows: 4, requestedHubs: 2 });
    expect(result.rows.map(row => row.sharedId)).toEqual(['a1', 'a2', 'center']);
    expect(hubsOf(result, 'a1')).toEqual(hubIds('hub2'));
    expect(hubsOf(result, 'a2')).toEqual(hubIds('hub3'));
    expect(hubsOf(result, 'center')).toEqual(hubIds('hub2', 'hub3'));
  });

  it('should fall back to every hub reaching a search result when filters match no connection', async () => {
    await setUp({
      entities: [
        entity('center', 'templateA'),
        entity('a1', 'templateA', 'alpha one'),
        entity('b1', 'templateB', 'beta one'),
      ],
      connections: [
        // b1 is reached through rel1, but only rel1+templateA is requested
        ...factory.hub('hub1', 'center', [{ entity: 'b1', template: 'rel1' }]),
        // a1 is reached through rel2, but only rel2+templateB is requested
        ...factory.hub('hub2', 'center', [{ entity: 'a1', template: 'rel2' }]),
        // rel3 is not part of the filter at all
        ...factory.hub('hub3', 'center', [{ entity: 'a1', template: 'rel3' }]),
      ],
    });

    const result = await search({
      sort: 'title',
      order: 'asc',
      filter: { ...filterFor('rel1', 'templateA'), ...filterFor('rel2', 'templateB') },
    });

    expect(result).toMatchObject({ totalHubs: 3, totalRows: 2, requestedHubs: 10 });
    expect(result.rows.map(row => row.sharedId)).toEqual(['a1', 'b1', 'center']);
    expect(hubsOf(result, 'a1')).toEqual(hubIds('hub2', 'hub3'));
    expect(hubsOf(result, 'b1')).toEqual(hubIds('hub1'));
    expect(hubsOf(result, 'center')).toEqual(hubIds('hub1', 'hub2', 'hub3'));
  });

  it('should only count and return hubs reaching entities that match the search term', async () => {
    await setUp({
      entities: [
        entity('center', 'templateA'),
        entity('a1', 'templateA', 'alpha one'),
        entity('a2', 'templateA', 'alpha two'),
        entity('b1', 'templateB', 'beta one'),
      ],
      connections: [
        ...factory.hub('hub1', 'center', [{ entity: 'a1', template: 'rel1' }]),
        ...factory.hub('hub2', 'center', [{ entity: 'a2', template: 'rel1' }]),
        ...factory.hub('hub3', 'center', [{ entity: 'b1', template: 'rel1' }]),
      ],
    });

    const result = await search({ sort: 'title', order: 'asc', searchTerm: 'alpha' });

    expect(result).toMatchObject({ totalHubs: 2, totalRows: 2, requestedHubs: 10 });
    expect(result.rows.map(row => row.sharedId)).toEqual(['a1', 'a2', 'center']);
    expect(hubsOf(result, 'center')).toEqual(hubIds('hub1', 'hub2'));
  });

  it('should pick a hub reaching the first search result when several hubs tie at the limit', async () => {
    await setUp({
      entities: [
        entity('center', 'templateA'),
        entity('a1', 'templateA', 'alpha one'),
        entity('b1', 'templateB', 'beta one'),
      ],
      connections: [
        ...factory.hub('hub1', 'center', [{ entity: 'a1', template: 'rel1' }]),
        ...factory.hub('hub2', 'center', [{ entity: 'a1', template: 'rel2' }]),
        ...factory.hub('hub3', 'center', [{ entity: 'b1', template: 'rel1' }]),
      ],
    });

    const result = await search({ sort: 'title', order: 'asc', limit: 1 });

    expect(result).toMatchObject({ totalHubs: 3, totalRows: 2, requestedHubs: 1 });
    expect(result.rows.map(row => row.sharedId)).toEqual(['a1', 'center']);
    expect(hubsOf(result, 'a1')).toHaveLength(1);
    expect(hubIds('hub1', 'hub2')).toContain(hubsOf(result, 'a1')[0]);
  });

  // Accepted behaviour changes, asserted once hub selection moves in memory:
  it.todo('should count a hub once toward `limit` when the entity appears twice in it');
  it.todo('should order hubs tied on sort position by hub id');
});
