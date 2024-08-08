import { testingEnvironment } from 'api/utils/testingEnvironment';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { MongoTemplatesDataSource } from 'api/templates.v2/database/MongoTemplatesDataSource';
import {
  GenerateAutomaticTranslationsCofig,
  SemanticConfig,
} from '../GenerateAutomaticTranslationConfig';
import { MongoAutomaticTranslationConfigDataSource } from '../database/MongoAutomaticTranslationConfigDataSource';

const factory = getFixturesFactory();

const validPassedConfig: SemanticConfig = {
  active: true,
  templates: [
    { template: 'Template 1 name', properties: ['Prop 1', 'Prop 2'], commonProperties: ['title'] },
    { template: 'Template 2 name', commonProperties: ['title'] },
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
  let automaticTranslationConfigDS: MongoAutomaticTranslationConfigDataSource;

  beforeEach(() => {
    automaticTranslationConfigDS = new MongoAutomaticTranslationConfigDataSource(
      getConnection(),
      DefaultTransactionManager()
    );
    generateAutomaticTranslationConfig = new GenerateAutomaticTranslationsCofig(
      automaticTranslationConfigDS,
      new MongoTemplatesDataSource(getConnection(), DefaultTransactionManager())
    );
  });

  it('should generate and persist the passed config', async () => {
    await generateAutomaticTranslationConfig.execute(validPassedConfig);

    const settingsData = await automaticTranslationConfigDS.get();

    expect(settingsData.active).toBe(true);
    expect(settingsData.templates).toEqual([
      {
        template: factory.id('Template 1 name'),
        properties: [factory.id('t1p1'), factory.id('t1p2')],
        commonProperties: [factory.commonPropertiesTitleId('Template 1 name')],
      },
      {
        template: factory.id('Template 2 name'),
        properties: [],
        commonProperties: [factory.commonPropertiesTitleId('Template 2 name')],
      },
      {
        template: factory.id('Template 3 name'),
        properties: [factory.id('t3p5')],
        commonProperties: [],
      },
    ]);
  });
});
