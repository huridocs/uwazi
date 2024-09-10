import { testingEnvironment } from 'api/utils/testingEnvironment';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { MongoTemplatesDataSource } from 'api/templates.v2/database/MongoTemplatesDataSource';
import { GenerateAutomaticTranslationsCofig } from '../GenerateAutomaticTranslationConfig';
import { MongoATConfigDataSource } from '../infrastructure/MongoATConfigDataSource';
import { GenerateATConfigError, InvalidInputDataFormat } from '../errors/generateATErrors';
import { SemanticConfig } from '../types/SemanticConfig';
import { AJVATConfigValidator } from '../infrastructure/AJVATConfigValidator';
import { SaveEntityTranslations } from '../SaveEntityTranslations';

const factory = getFixturesFactory();

const validPassedConfig: SemanticConfig = {
  active: true,
  templates: [
    { template: 'Template 1 name', properties: ['Prop 1', 'Prop 2'], commonProperties: ['Title'] },
    { template: 'Template 2 name', commonProperties: ['Title'] },
    { template: 'Template 3 name', properties: ['Prop 5'] },
  ],
};

const fixtures = {
  templates: [
    factory.template('Template 1 name', [
      {
        _id: factory.id('t1p1'),
        name: 'prop_1',
        type: 'text',
        label: 'Prop 1',
      },
      {
        _id: factory.id('t1p2'),
        name: 'prop_2',
        type: 'text',
        label: 'Prop 2',
      },
      {
        _id: factory.id('t1p3'),
        name: 'prop_3',
        type: 'date',
        label: 'Prop 3',
      },
    ]),
  ],
  settings: [{}],
};

beforeEach(async () => {
  await testingEnvironment.setUp(fixtures);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('GenerateAutomaticTranslationConfig', () => {
  let generateAutomaticTranslationConfig: SaveEntityTranslations;
  let automaticTranslationConfigDS: MongoATConfigDataSource;

  beforeEach(() => {
    automaticTranslationConfigDS = new MongoATConfigDataSource(
      getConnection(),
      DefaultTransactionManager()
    );
    generateAutomaticTranslationConfig = new SaveEntityTranslations(
      automaticTranslationConfigDS,
      new AJVATConfigValidator()
    );
  });

  it('should validate input has proper shape at runtime', async () => {
    const invalidConfig = { invalid_prop: true };
    await expect(generateAutomaticTranslationConfig.execute(invalidConfig)).rejects.toEqual(
      new InvalidInputDataFormat('{"additionalProperty":"invalid_prop"}')
    );
  });
});
