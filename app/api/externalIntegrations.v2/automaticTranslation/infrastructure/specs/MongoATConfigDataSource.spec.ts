import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { AutomaticTranslationFactory } from '../../AutomaticTranslationFactory';

const fixtures = getFixturesFactory();

const createDS = () => {
  const transactionManager = DefaultTransactionManager();
  return AutomaticTranslationFactory.defaultATConfigDataSource(transactionManager);
};

beforeEach(async () => {
  await testingEnvironment.setUp({
    templates: [
      fixtures.template('template 1', [
        fixtures.property('text property', 'text'),
        fixtures.property('select property', 'select'),
        fixtures.property('rich text', 'markdown'),
        fixtures.property('multiselect_property', 'multiselect'),
      ]),
      fixtures.template('template 2', [
        fixtures.property('text property 2', 'text'),
        fixtures.property('text property 3', 'markdown'),
        fixtures.property('multiselect_property', 'multiselect'),
      ]),
      fixtures.template('template 3', []),
    ],
    settings: [
      {
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
      },
    ],
  });
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('MongoAtConfigDataSource', () => {
  it('should return only title, text and markdown properties', async () => {
    const config = await createDS().get();
    expect(config.templates[0]).toEqual({
      template: fixtures.id('template 1').toString(),
      commonProperties: [fixtures.commonPropertiesTitleId('template 1')],
      properties: [fixtures.id('text property').toString(), fixtures.id('rich text').toString()],
    });
  });

  it('should not include properties that no longer exist', async () => {
    const config = await createDS().get();
    expect(config.templates[0].properties).toEqual([
      fixtures.id('text property').toString(),
      fixtures.id('rich text').toString(),
    ]);
  });

  it('should not include properties belonging to other templates', async () => {
    const config = await createDS().get();
    expect(config.templates[1]).toEqual({
      template: fixtures.id('template 2').toString(),
      commonProperties: [],
      properties: [fixtures.id('text property 2').toString()],
    });
  });

  it('should return languages available filtered by the supported languages of automatic translation', async () => {
    const config = await createDS().get();
    expect(config.languages).toEqual(['en', 'es']);
  });

  it('should allow configuring only title without any properties', async () => {
    const config = await createDS().get();
    expect(config.templates[2]).toEqual({
      template: fixtures.id('template 3').toString(),
      commonProperties: [fixtures.commonPropertiesTitleId('template 3')],
      properties: [],
    });
  });

  it('should not include properties configurations belonging to an unexistent template', async () => {
    const config = await createDS().get();
    expect(config.templates[3]).toBeUndefined();
  });
});
