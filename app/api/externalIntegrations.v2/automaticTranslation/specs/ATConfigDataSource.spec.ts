import { CommonProperty } from '#api/core/domain/template/CommonProperty.js';
import { Property } from '#api/core/domain/template/Property.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingDB } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { Settings } from '#shared/types/settingsType.js';
import { AutomaticTranslationFactory } from '../AutomaticTranslationFactory.js';
import { ATTemplateConfig } from '../model/ATConfig.js';

const fixtures = getFixturesFactory();

const thesaurusId = fixtures.id('thesaurus').toString();

const templates = [
  fixtures.template('template 1', [
    fixtures.property('text property', 'text'),
    fixtures.property('select property', 'select', { content: thesaurusId }),
    fixtures.property('rich text', 'markdown'),
    fixtures.property('multiselect_property', 'multiselect', { content: thesaurusId }),
  ]),
  fixtures.template('template 2', [
    fixtures.property('text property 2', 'text'),
    fixtures.property('text property 3', 'markdown'),
    fixtures.property('multiselect_property', 'multiselect', { content: thesaurusId }),
  ]),
  fixtures.template('template 3', []),
];

const automaticTranslationSettings: Settings = {
  languages: [
    { default: true, label: 'English', key: 'en' },
    { label: 'Spanish', key: 'es' },
    { label: 'Norwegian', key: 'nb' },
    { label: 'Lithuanian', key: 'lt' },
  ],
  features: {
    automaticTranslation: {
      active: true,
      templates: [
        {
          template: fixtures.id('template 1').toString(),
          commonProperties: [fixtures.commonPropertiesTitleId('template 1')],
          properties: [
            fixtures.id('text property').toString(),
            fixtures.id('select property').toString(),
            fixtures.id('rich text').toString(),
            fixtures.id('multiselect_property').toString(),
            fixtures.id('this property does not exist on the template').toString(),
          ],
        },
        {
          template: fixtures.id('template 2').toString(),
          properties: [
            fixtures.id('text property').toString(),
            fixtures.id('text property 2').toString(),
          ],
        },
        {
          template: fixtures.id('template 3').toString(),
          commonProperties: [fixtures.commonPropertiesTitleId('template 3')],
          properties: [],
        },
        {
          template: fixtures.id('non existent template').toString(),
          properties: [fixtures.id('text property non existent template').toString()],
        },
      ],
    },
  },
};

const testConfigs = [
  { name: 'Mongo', postgresCore: false },
  { name: 'Postgres', postgresCore: true },
];

const expectConfigInActiveBackend = async (postgresCore: boolean, expected: unknown) => {
  const mongo = await testingDB.mongodb?.collection('settings').findOne({});
  const rows = await testingPG.getAllFrom('settings');
  expect(rows).toHaveLength(1);

  if (postgresCore) {
    expect(rows[0].features).toEqual({ automaticTranslation: expected });
    expect(mongo?.features?.automaticTranslation).toBeUndefined();
  } else {
    expect(mongo?.features?.automaticTranslation).toEqual(expected);
    expect(rows[0].features?.automaticTranslation).toBeUndefined();
  }
};

describe('ATConfigDataSource', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(testConfigs)('$name', ({ postgresCore }) => {
    const settingsContext = () =>
      postgresCore
        ? { tenant: { ...testingTenants.current(), featureFlags: { postgresCore: true } } }
        : undefined;

    const createDS = () =>
      testingEnvironment.runWithContext(
        () =>
          AutomaticTranslationFactory.defaultATConfigDataSource(
            TransactionManagerFactory.default()
          ),
        settingsContext()
      );

    describe('get()', () => {
      beforeEach(async () => {
        await testingEnvironment.setUp(
          { templates, settings: [automaticTranslationSettings] },
          { postgres: true, postgresMirror: ['settings', 'templates'] }
        );
      });

      it('should return only title, text and markdown properties', async () => {
        const config = await createDS().get();
        expect(config.templates[0]).toMatchObject({
          template: fixtures.id('template 1').toString(),
          properties: [
            { id: fixtures.commonPropertiesTitleId('template 1') },
            { id: fixtures.id('text property').toString() },
            { id: fixtures.id('rich text').toString() },
          ],
        });
      });

      it('should not include properties that no longer exist', async () => {
        const config = await createDS().get();
        expect(config.templates[0].properties).toMatchObject([
          { id: fixtures.commonPropertiesTitleId('template 1') },
          { id: fixtures.id('text property').toString() },
          { id: fixtures.id('rich text').toString() },
        ]);
      });

      it('should not include properties belonging to other templates', async () => {
        const config = await createDS().get();
        expect(config.templates[1]).toMatchObject({
          template: fixtures.id('template 2').toString(),
          properties: [{ id: fixtures.id('text property 2').toString() }],
        });
      });

      it('should return languages available filtered by the supported languages of automatic translation', async () => {
        const config = await createDS().get();
        expect(config.languages).toEqual(['en', 'es']);
      });

      it('should allow configuring only title without any properties', async () => {
        const config = await createDS().get();
        expect(config.templates[2]).toMatchObject({
          template: fixtures.id('template 3').toString(),
          properties: [{ label: 'Title' }],
        });
      });

      it('should not include properties configurations belonging to an unexistent template', async () => {
        const config = await createDS().get();
        expect(config.templates[3]).toBeUndefined();
      });
    });

    describe('update()', () => {
      it('should persist the automatic translation config to the active backend', async () => {
        await testingEnvironment.setUp(
          { settings: [{}] },
          { postgres: true, postgresMirror: ['settings'] }
        );

        const config = [
          new ATTemplateConfig(fixtures.id('template 1').toString(), [
            new CommonProperty({
              id: fixtures.commonPropertiesTitleId('template 1'),
              type: 'text',
              template: fixtures.id('template 1').toString(),
              label: 'Title',
            }),
            new Property({
              id: fixtures.id('text property').toString(),
              type: 'text',
              template: fixtures.id('template 1').toString(),
              label: 'text property',
            }),
          ]),
        ];

        await createDS().update(true, config);

        const expected = {
          active: true,
          templates: [
            {
              template: fixtures.id('template 1').toString(),
              properties: [fixtures.id('text property').toString()],
              commonProperties: [fixtures.commonPropertiesTitleId('template 1')],
            },
          ],
        };

        await expectConfigInActiveBackend(postgresCore, expected);
      });
    });

    describe('backend routing', () => {
      const itOnPostgres = postgresCore ? it : it.skip;
      itOnPostgres(
        'should read the automatic translation config from Postgres, not Mongo',
        async () => {
          await testingEnvironment.setUp(
            { templates, settings: [{ languages: automaticTranslationSettings.languages }] },
            { postgres: true, postgresMirror: ['templates'] }
          );

          await testingPG.setFixtures({
            settings: [
              {
                _id: 'postgres-settings',
                features: { automaticTranslation: { active: true } },
              },
            ],
          });

          const config = await createDS().get();
          expect(config.active).toBe(true);
        }
      );
    });
  });
});
