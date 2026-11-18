import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';
import { Property } from '#api/core/domain/template/Property.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { DBFixture } from '#api/utils/testing_db.js';

const f = getFixturesFactory();

const TENANT_ID = 'templates-datasource-contract';

const testConfigs = [
  { name: 'Mongo', usePostgres: false },
  { name: 'Postgres', usePostgres: true },
];

const sharedProperty = (template: string) =>
  f.property('t_est', 'text', { _id: f.id(`${template}-t_est`), label: 'T!est' });

const fixtures: DBFixture = {
  templates: [
    f.template('template A', [sharedProperty('template A')]),
    f.template('template B', [sharedProperty('template B')]),
    f.template('template C', [
      f.property('other', 'text', { _id: f.id('template C-other'), label: 'other' }),
    ]),
  ],
};

const candidate = (template: string) =>
  new Property({ id: 'candidate', label: 'T?est', type: 'text', template });

describe('TemplatesDataSource', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(testConfigs)('$name', ({ usePostgres }) => {
    beforeEach(async () => {
      testingTenants.changeCurrentTenant({
        name: TENANT_ID,
        featureFlags: { postgresCore: usePostgres },
      });

      await testingEnvironment.setFixtures(fixtures);
    });

    const sut = () => testingEnvironment.runWithContext(() => TemplatesDataSourceFactory.default());

    describe('getTemplatesByPropertyName()', () => {
      it('should return every template with a property of that name when there is no template to exclude', async () => {
        const templates = await sut().getTemplatesByPropertyName(candidate(''));

        expect(templates.map(t => t.name).sort()).toEqual(['template A', 'template B']);
      });

      it('should exclude the property own template', async () => {
        const templates = await sut().getTemplatesByPropertyName(
          candidate(f.idString('template A'))
        );

        expect(templates.map(t => t.name)).toEqual(['template B']);
      });
    });
  });
});
