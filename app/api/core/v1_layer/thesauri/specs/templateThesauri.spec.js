import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { testingDB } from '#api/utils/testing_db.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { User } from '#api/users.v2/model/User.js';
import { thesauri } from '../thesauri.js';

const factory = getFixturesFactory();

const fixtures = {
  settings: [{ _id: testingDB.id(), languages: [{ key: 'es', label: 'ES', default: true }] }],
  templates: [factory.template('optionsTemplate', [])],
  entities: [
    factory.entity('optionA', 'optionsTemplate', {}, { language: 'es', published: true }),
    factory.entity('optionB', 'optionsTemplate', {}, { language: 'es', published: true }),
  ],
};

const backends = [
  { name: 'Mongo', usePostgres: false },
  { name: 'Postgres', usePostgres: true },
];

/**
 * Templates double as thesauri: a select or relationship property can draw its options from a
 * template's entities, so listing thesauri reads every template's entities through a projection.
 * Postgres takes that projection literally — a field name Mongo simply ignored answered 500 for
 * the whole request, on every template at once (F51). This is the store-parity cover for it, in
 * its own file because `thesauri.spec.js` is Mongo-only and carries an entity with no title,
 * which Postgres will not take as null.
 */
describe('thesauri.get() with a template-backed thesaurus', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures, { postgres: true, elasticIndex: true });
  });

  afterAll(async () => testingEnvironment.tearDown());

  describe.each(backends)('$name', ({ usePostgres }) => {
    beforeEach(async () => {
      testingTenants.changeCurrentTenant({ featureFlags: { postgresCore: usePostgres } });
    });

    it('should list the entities of the template as its options', async () => {
      await testingEnvironment.runWithContext(
        async () => {
          const thesaurus = await thesauri.get(null, 'es');
          const fromTemplate = thesaurus.find(t => t.name === 'optionsTemplate');

          expect(fromTemplate).toMatchObject({ type: 'template' });
          expect(fromTemplate.values.map(value => value.label).sort()).toEqual([
            'optionA',
            'optionB',
          ]);
        },
        { actor: User.createFrom(null) }
      );
    });
  });
});
