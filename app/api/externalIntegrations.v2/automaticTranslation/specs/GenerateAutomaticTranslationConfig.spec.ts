import { testingEnvironment } from 'api/utils/testingEnvironment';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { MongoTemplatesDataSource } from 'api/templates.v2/database/MongoTemplatesDataSource';
import { GenerateAutomaticTranslationsCofig } from '../GenerateAutomaticTranslationConfig';
import { MongoATConfigDataSource } from '../infrastructure/MongoATConfigDataSource';
import { GenerateATConfigError } from '../errors/generateATErrors';
import { SemanticConfig, semanticConfigSchema } from '../types/SemanticConfig';
import { ValidationError, Validator } from '../infrastructure/Validator';

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
    factory.template('Template 2 name', [
      {
        _id: factory.id('t2p4'),
        name: 'prop_4',
        type: 'text',
        label: 'Prop 1',
      },
    ]),
    factory.template('Template 3 name', [
      {
        _id: factory.id('t3p5'),
        name: 'prop_5',
        type: 'markdown',
        label: 'Prop 5',
      },
    ]),
    factory.template('Not used template', []),
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
  let generateAutomaticTranslationConfig: GenerateAutomaticTranslationsCofig;
  let automaticTranslationConfigDS: MongoATConfigDataSource;

  beforeEach(() => {
    automaticTranslationConfigDS = new MongoATConfigDataSource(
      getConnection(),
      DefaultTransactionManager()
    );
    generateAutomaticTranslationConfig = new GenerateAutomaticTranslationsCofig(
      automaticTranslationConfigDS,
      new MongoTemplatesDataSource(getConnection(), DefaultTransactionManager()),
      new Validator<SemanticConfig>(semanticConfigSchema)
    );
  });

  it('should deactivate the service properly', async () => {
    await generateAutomaticTranslationConfig.execute({ active: false, templates: [] });
    const settingsData = await automaticTranslationConfigDS.get();
    expect(settingsData.active).toBe(false);
  });

  it('should generate and persist the passed config', async () => {
    await generateAutomaticTranslationConfig.execute(validPassedConfig);

    const settingsData = await automaticTranslationConfigDS.get();

    expect(settingsData.active).toBe(true);
    expect(settingsData.templates).toEqual([
      {
        template: factory.idString('Template 1 name'),
        properties: [factory.idString('t1p1').toString(), factory.idString('t1p2').toString()],
        commonProperties: [factory.commonPropertiesTitleId('Template 1 name')],
      },
      {
        template: factory.idString('Template 2 name'),
        properties: [],
        commonProperties: [factory.commonPropertiesTitleId('Template 2 name')],
      },
      {
        template: factory.idString('Template 3 name'),
        properties: [factory.idString('t3p5')],
        commonProperties: [],
      },
    ]);
  });

  describe('when template does not match', () => {
    it('should throw a template not found error error', async () => {
      const invalidConfig: SemanticConfig = {
        active: true,
        templates: [{ template: 'template name does not exist' }],
      };
      await expect(generateAutomaticTranslationConfig.execute(invalidConfig)).rejects.toEqual(
        new GenerateATConfigError('Template not found: template name does not exist')
      );
    });
  });

  describe('when a property does not match', () => {
    it('should throw a property not found error', async () => {
      const invalidConfig: SemanticConfig = {
        active: true,
        templates: [
          { template: 'Template 1 name', properties: ['prop 1 does not exist', 'Prop 2'] },
        ],
      };
      await expect(generateAutomaticTranslationConfig.execute(invalidConfig)).rejects.toEqual(
        new GenerateATConfigError('Property not found: prop 1 does not exist')
      );
    });
  });

  describe('when a common property does not match', () => {
    it('should throw a common property not found error', async () => {
      const invalidConfig: SemanticConfig = {
        active: true,
        templates: [
          { template: 'Template 1 name', commonProperties: ['common property does not exist'] },
        ],
      };
      await expect(generateAutomaticTranslationConfig.execute(invalidConfig)).rejects.toEqual(
        new GenerateATConfigError('Common property not found: common property does not exist')
      );
    });
  });

  it('should validate input has proper shape at runtime', async () => {
    const invalidConfig = { invalid_prop: true };
    await expect(generateAutomaticTranslationConfig.execute(invalidConfig)).rejects.toBeInstanceOf(
      ValidationError
    );
    await expect(generateAutomaticTranslationConfig.execute(invalidConfig)).rejects.toEqual(
      new ValidationError('must NOT have additional properties')
    );
  });
});
