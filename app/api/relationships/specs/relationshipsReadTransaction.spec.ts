import { ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { User } from '#api/users.v2/model/User.js';
import relationships from '../relationships.js';

const factory = getFixturesFactory();

const collaborator = User.createFrom({
  _id: new ObjectId(),
  role: 'collaborator',
  groups: [],
  email: 'collaborator@test.com',
  username: 'collaborator',
});

const fixtures: DBFixture = {
  settings: [{ languages: [{ key: 'en', label: 'EN', default: true }] }],
  templates: [factory.template('template1'), factory.template('template2')],
  relationtypes: [factory.relationType('relationType1'), factory.relationType('relationType2')],
  entities: [
    factory.entity('entity1', 'template1', {}, { language: 'en', published: true }),
    factory.entity('entity2', 'template1', {}, { language: 'en', published: true }),
    factory.entity('entity3', 'template2', {}, { language: 'en', published: true }),
  ],
  files: [factory.document('entity2-doc', { entity: 'entity2', language: 'en' })],
  connections: [
    ...factory.hub('hub1', 'entity1', [{ entity: 'entity2', template: 'relationType1' }]),
    ...factory.hub('hub2', 'entity1', [{ entity: 'entity3', template: 'relationType2' }]),
  ],
};

const recordStatements = () => {
  const statements: string[] = [];
  const listener = (query: { sql: string }) => statements.push(query.sql);
  PostgresDB.knex.on('query', listener);
  return { statements, stop: () => PostgresDB.knex.removeListener('query', listener) };
};

const transactionsOpened = (statements: string[]) =>
  statements.filter(sql => sql.startsWith('BEGIN'));

describe('relationships read transactions', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures, { postgres: true });
    testingTenants.changeCurrentTenant({ featureFlags: { postgresCore: true } });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('getGroupsByConnection()', () => {
    it('should read everything in one read only transaction', async () => {
      const recorder = recordStatements();

      const groups = await testingEnvironment.runWithContext(
        async () => relationships.getGroupsByConnection('entity1', 'en', { excludeRefs: true }),
        { actor: collaborator }
      );
      recorder.stop();

      expect(groups).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ key: factory.idString('relationType1') }),
          expect.objectContaining({ key: factory.idString('relationType2') }),
        ])
      );
      expect(transactionsOpened(recorder.statements)).toEqual(['BEGIN TRANSACTION READ ONLY;']);
    });
  });
});
