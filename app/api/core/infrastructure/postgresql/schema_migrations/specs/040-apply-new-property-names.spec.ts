/* eslint-disable max-statements */
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { migration } from '../040-apply-new-property-names.js';
import {
  TENANT_A,
  TENANT_B,
  country,
  renameFixtures,
  settingsRow,
} from './040-apply-new-property-names.fixtures.js';

const TABLES = [
  'settings',
  'templates',
  'entities',
  'files',
  'ix_extractors',
  'ix_suggestions',
  'pages',
  'page_locales',
  'page_releases',
];

type Row = Record<string, unknown> & { tenant_id: string };

const rows = async (table: string) => testingEnvironment.pg.getAllFrom<Row>(table);

const ofTenant = async (table: string, tenantId: string) =>
  (await rows(table)).filter(row => row.tenant_id === tenantId);

const run = async (tenants = [TENANT_A, TENANT_B]) =>
  testingEnvironment.pg.runDataMigration(migration, tenants);

describe('040-apply-new-property-names', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  beforeEach(async () => {
    await testingEnvironment.pg.pool?.query(
      'ALTER TABLE settings ADD COLUMN IF NOT EXISTS new_name_generation BOOLEAN'
    );
    await testingEnvironment.setFixtures({}, Object.fromEntries(TABLES.map(table => [table, []])));
  });

  it('should declare that a reindex may be requested', () => {
    expect(migration.reindex).toBe(true);
  });

  it('should do nothing on empty tables', async () => {
    const { reindexed } = await run();

    expect(reindexed).toEqual([]);
    expect(await rows('settings')).toEqual([]);
  });

  it('should leave a tenant whose flag is already true', async () => {
    await testingEnvironment.setFixtures(
      {},
      {
        settings: [settingsRow(TENANT_A, { new_name_generation: true })],
        templates: [{ _id: 'tpl-a', tenant_id: TENANT_A, name: 'A', properties: [country] }],
      }
    );

    const { reindexed } = await run([TENANT_A]);
    const [template] = await ofTenant('templates', TENANT_A);

    expect(reindexed).toEqual([]);
    expect((template.properties as { name: string }[])[0].name).toBe('pa_s');
  });

  it('should set the flag when names already match', async () => {
    await testingEnvironment.setFixtures(
      {},
      {
        settings: [{ _id: 'settings-a', tenant_id: TENANT_A }],
        templates: [
          {
            _id: 'tpl-a',
            tenant_id: TENANT_A,
            name: 'A',
            properties: [{ label: 'Pais', name: 'pais', type: 'text' }],
          },
        ],
      }
    );

    const { reindexed } = await run([TENANT_A]);
    const [settings] = await ofTenant('settings', TENANT_A);

    expect(reindexed).toEqual([]);
    expect(settings.new_name_generation).toBe(true);
  });

  it('should rename one tenant and leave the other', async () => {
    await testingEnvironment.setFixtures({}, renameFixtures());

    const { reindexed } = await run();
    const [templateA] = await ofTenant('templates', TENANT_A);
    const [entityA] = await ofTenant('entities', TENANT_A);
    const [entityB] = await ofTenant('entities', TENANT_B);
    const [fileA] = await ofTenant('files', TENANT_A);
    const [extractorA] = await ofTenant('ix_extractors', TENANT_A);
    const [suggestionA] = await ofTenant('ix_suggestions', TENANT_A);
    const [suggestionB] = await ofTenant('ix_suggestions', TENANT_B);
    const [settingsA] = await ofTenant('settings', TENANT_A);
    const [settingsB] = await ofTenant('settings', TENANT_B);
    const [locale] = await ofTenant('page_locales', TENANT_A);
    const [release] = await ofTenant('page_releases', TENANT_A);
    const names = (templateA.properties as { name: string }[]).map(property => property.name);
    const releaseLocales = release.locales as {
      en: { draft: { content: string; script: string } };
    };

    expect(reindexed).toEqual([TENANT_A]);
    expect(names).toEqual(['país', 'pa', 'ubicación_geolocation']);
    expect(entityA.metadata).toEqual({ país: [{ value: 'a' }], pa: [{ value: 'b' }] });
    expect(entityB.metadata).toEqual({ pa_s: [{ value: 'stay' }] });
    expect(fileA.propertySelections).toEqual([{ name: 'país' }, { name: 'title' }]);
    expect(extractorA).toMatchObject({
      property: 'país',
      source: { property: 'ubicación_geolocation' },
    });
    expect(suggestionA.propertyName).toBe('país');
    expect(suggestionB.propertyName).toBe('pa_s');
    expect(settingsA.new_name_generation).toBe(true);
    expect(settingsB.new_name_generation).toBe(true);
    expect((settingsA.links as { url?: string; sublinks?: { url: string }[] }[])[0].url).toBe(
      '/en/library/?q=(país:1)'
    );
    expect((settingsA.links as { sublinks?: { url: string }[] }[])[1].sublinks?.[0].url).toBe(
      '/library/?q=(país:2)'
    );
    expect((settingsA.site_preferences as { home_page: string }).home_page).toBe(
      '/library/?q=(filters:(país:3))'
    );
    expect(locale.draft_content).toBe('/library/?q=(país:1,pa:2,pa_sx:3)');
    expect(locale.draft_script).toBe('property="país" filterProperty="país"');
    expect(releaseLocales.en.draft.content).toBe('{list}(país:5)');
    expect(releaseLocales.en.draft.script).toBe("property='país'");
  });

  it('should give the same result when run twice', async () => {
    await testingEnvironment.setFixtures({}, renameFixtures());
    await run();
    const once = await rows('templates');

    const { reindexed } = await run();

    expect(await rows('templates')).toEqual(once);
    expect(reindexed).toEqual([]);
  });

  it('should fail a tenant whose properties would collide', async () => {
    await testingEnvironment.setFixtures(
      {},
      {
        settings: [{ _id: 'settings-a', tenant_id: TENANT_A }],
        templates: [
          {
            _id: 'tpl-a',
            tenant_id: TENANT_A,
            name: 'A',
            properties: [
              { label: 'A/B', name: 'a_b', type: 'text' },
              { label: 'A B', name: 'a_b_2', type: 'text' },
            ],
          },
        ],
      }
    );

    await expect(run([TENANT_A])).rejects.toThrow(/collid/i);
    const [settings] = await ofTenant('settings', TENANT_A);
    expect(settings.new_name_generation).toBeNull();
  });

  it('should fail a tenant whose extractor templates disagree', async () => {
    await testingEnvironment.setFixtures(
      {},
      {
        settings: [{ _id: 'settings-a', tenant_id: TENANT_A }],
        templates: [
          { _id: 'tpl-a', tenant_id: TENANT_A, name: 'A', properties: [country] },
          {
            _id: 'tpl-b',
            tenant_id: TENANT_A,
            name: 'B',
            properties: [{ label: 'Paìs', name: 'pa_s', type: 'text' }],
          },
        ],
        ix_extractors: [
          {
            _id: 'ext-a',
            tenant_id: TENANT_A,
            name: 'country',
            property: 'pa_s',
            source: { pdf: true },
            templates: ['tpl-a', 'tpl-b'],
          },
        ],
      }
    );

    await expect(run([TENANT_A])).rejects.toThrow(/extractor/i);
  });
});
