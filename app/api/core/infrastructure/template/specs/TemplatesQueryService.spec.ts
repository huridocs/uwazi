import { TemplatesQueryServiceFactory } from '#api/core/infrastructure/factories/TemplatesQueryServiceFactory.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { DBFixture } from '#api/utils/testing_db.js';
import type { PropertyCandidate } from '../TemplatesQueryService.js';

const f = getFixturesFactory();

const TENANT_ID = 'templates-query-service';

const testConfigs = [
  { name: 'Mongo', usePostgres: false },
  { name: 'Postgres', usePostgres: true },
];

const prop = (template: string, name: string, type: any, props: object = {}) =>
  f.property(name, type, { _id: f.id(`${template}-${name}`), label: name, ...props });

const fixtures: DBFixture = {
  templates: [
    f.template('Cases', [
      prop('Cases', 't_est', 'text', { label: 'T!est' }),
      prop('Cases', 'country', 'select', { content: f.idString('countries') }),
      prop('Cases', 'victims', 'relationship', {
        relationType: f.idString('victim of'),
        content: f.idString('People'),
        inherit: { property: f.idString('People-nationality'), type: 'text' },
      }),
    ]),
    f.template('Reports', [
      prop('Reports', 't_est', 'markdown', { label: 'T.est' }),
      prop('Reports', 'country', 'multiselect', { content: f.idString('countries') }),
    ]),
    f.template('People', [prop('People', 'nationality', 'text')]),
  ],
};

const match = (template: string, name: string, extra: object) => ({
  templateId: f.idString(template),
  templateName: template,
  propertyId: f.idString(`${template}-${name}`),
  ...extra,
});

describe('TemplatesQueryService', () => {
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

    const getPropertyMatches = async (candidate: PropertyCandidate) => {
      const result = await testingEnvironment.runWithContext(async () =>
        TemplatesQueryServiceFactory.default().getPropertyMatches(candidate)
      );
      return {
        ...result,
        matches: [...result.matches].sort((a, b) => a.templateName.localeCompare(b.templateName)),
      };
    };

    describe('getPropertyMatches()', () => {
      it('should match by derived name, not by label', async () => {
        const result = await getPropertyMatches({ label: 'T?est', type: 'text' });

        expect(result).toEqual({
          name: 't_est',
          matches: [
            match('Cases', 't_est', { label: 'T!est', type: 'text', conflicts: [] }),
            match('Reports', 't_est', { label: 'T.est', type: 'markdown', conflicts: [] }),
          ],
        });
      });

      it('should exclude the candidate own template', async () => {
        const result = await getPropertyMatches({
          label: 'T?est',
          type: 'text',
          templateId: f.idString('Cases'),
        });

        expect(result.matches.map(m => m.templateName)).toEqual(['Reports']);
      });

      it('should report a type conflict for incompatible types', async () => {
        const result = await getPropertyMatches({ label: 'T?est', type: 'numeric' });

        expect(result.matches.map(m => m.conflicts)).toEqual([['type'], ['type']]);
      });

      it('should report a content conflict for selects on a different thesaurus', async () => {
        const result = await getPropertyMatches({
          label: 'Country',
          type: 'select',
          content: f.idString('regions'),
        });

        expect(result.matches).toEqual([
          match('Cases', 'country', {
            label: 'country',
            type: 'select',
            content: f.idString('countries'),
            conflicts: ['content'],
          }),
          match('Reports', 'country', {
            label: 'country',
            type: 'multiselect',
            content: f.idString('countries'),
            conflicts: ['content'],
          }),
        ]);
      });

      it('should report an inheritType conflict for relationships inheriting a different type', async () => {
        const result = await getPropertyMatches({
          label: 'Victims',
          type: 'relationship',
          relationType: f.idString('victim of'),
          content: f.idString('People'),
          inherit: { property: f.idString('People-nationality'), type: 'date' },
        });

        expect(result.matches).toEqual([
          match('Cases', 'victims', {
            label: 'victims',
            type: 'relationship',
            relationType: f.idString('victim of'),
            content: f.idString('People'),
            inherit: { property: f.idString('People-nationality'), type: 'text' },
            conflicts: ['inheritType'],
          }),
        ]);
      });

      it('should return the derived name and no matches when nothing shares it', async () => {
        const result = await getPropertyMatches({ label: 'Brand new', type: 'text' });

        expect(result).toEqual({ name: 'brand_new', matches: [] });
      });

      it('should not match built-in properties of other templates', async () => {
        const result = await getPropertyMatches({ label: 'Title', type: 'text' });

        expect(result).toEqual({ name: 'title', matches: [] });
      });
    });
  });
});
