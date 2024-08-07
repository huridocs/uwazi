import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { GetAutomaticTranslationConfig } from '../GetAutomaticTranslationConfig';

const createService = () => {
  const transactionManager = DefaultTransactionManager();
  return new GetAutomaticTranslationConfig(DefaultSettingsDataSource(transactionManager));
};

const fixtures = getFixturesFactory();

beforeEach(async () => {
  await testingEnvironment.setUp({
    templates: [
      fixtures.template('template 1', [
        fixtures.property('text property', 'text'),
        fixtures.property('select property', 'select'),
        fixtures.property('rich text', 'markdown'),
        fixtures.property('multiselect_property', 'multiselect'),
      ]),
    ],
    settings: [
      {
        languages: [
          { default: true, label: 'English', key: 'en' },
          { label: 'Spanish', key: 'es' },
        ],
        features: {
          automaticTranslation: {
            active: true,
            templates: [
              {
                template: fixtures.id('template 1').toString(),
                commonProperties: [fixtures.commonPropertiesTitleId()],
                properties: [
                  fixtures.id('text property').toString(),
                  fixtures.id('select property').toString(),
                  fixtures.id('rich text').toString(),
                  fixtures.id('multiselect_property').toString(),
                ],
              },
            ],
          },
        },
      },
    ],
  });
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('GetATConfig', () => {
  it('should return only text and markdown properties', async () => {
    const config = await createService().execute();
    expect(config).toMatchObject({
      templates: {
        [fixtures.id('template 1').toString()]: {
          commonProperties: [fixtures.commonPropertiesTitleId()],
          properties: [
            fixtures.id('text property').toString(),
            fixtures.id('rich text').toString(),
          ],
        },
      },
    });
  });
});
