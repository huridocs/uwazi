import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { MongoEntitiesDataSource } from 'api/entities.v2/database/MongoEntitiesDataSource';
import { DefaultEntitiesDataSource } from 'api/entities.v2/database/data_source_defaults';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import testingDB from 'api/utils/testing_db';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { SaveEntityTranslations } from '../SaveEntityTranslations';
import { InvalidInputDataFormat } from '../errors/generateATErrors';
import { AJVTranslationResultValidator } from '../infrastructure/AJVTranslationResultValidator';
import { TranslationResult } from '../types/TranslationResult';
import { DefaultTemplatesDataSource } from 'api/templates.v2/database/data_source_defaults';

const factory = getFixturesFactory();

const fixtures = {
  templates: [
    factory.template('template1', [
      {
        _id: factory.id('propertyName'),
        name: 'propertyName',
        type: 'text',
        label: 'Prop 1',
      },
    ]),
  ],
  entities: [
    ...factory.entityInMultipleLanguages(['en', 'pt', 'es'], 'entity', 'template1', {
      propertyName: [{ value: 'original text' }],
    }),
  ],
  settings: [
    {
      languages: [
        { label: 'en', key: 'en' as LanguageISO6391, default: true },
        { label: 'pt', key: 'pt' as LanguageISO6391 },
        { label: 'es', key: 'es' as LanguageISO6391 },
      ],
    },
  ],
};

beforeEach(async () => {
  await testingEnvironment.setUp(fixtures);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('GenerateAutomaticTranslationConfig', () => {
  let saveEntityTranslations: SaveEntityTranslations;

  beforeEach(() => {
    const transactionManager = DefaultTransactionManager();
    saveEntityTranslations = new SaveEntityTranslations(
      DefaultTemplatesDataSource(transactionManager),
      DefaultEntitiesDataSource(transactionManager),
      new AJVTranslationResultValidator()
    );
  });

  it('should validate input has proper shape at runtime', async () => {
    const invalidConfig = { invalid_prop: true };
    await expect(saveEntityTranslations.execute(invalidConfig)).rejects.toEqual(
      new InvalidInputDataFormat('{"additionalProperty":"invalid_prop"}')
    );
  });

  it('should save entity with translated text with prepended "(AI translated)"', async () => {
    const translationResult: TranslationResult = {
      key: ['tenant', 'entity', factory.idString('propertyName')],
      text: 'original text',
      language_from: 'en',
      languages_to: ['es', 'pt'],
      translations: [
        { text: 'texto original', language: 'es', success: true, error_message: '' },
        { text: 'texto original (pt)', language: 'pt', success: true, error_message: '' },
      ],
    };

    await saveEntityTranslations.execute(translationResult);

    const entities = await testingDB.mongodb
      ?.collection('entities')
      .find({ sharedId: 'entity' })
      .toArray();

    expect(entities.find(e => e.language === 'es')).toMatchObject({
      metadata: { propertyName: [{ value: '(AI translated) texto original' }] },
    });

    expect(entities.find(e => e.language === 'pt')).toMatchObject({
      metadata: { propertyName: [{ value: '(AI translated) texto original (pt)' }] },
    });

    expect(entities.find(e => e.language === 'en')).toMatchObject({
      metadata: { propertyName: [{ value: 'original text' }] },
    });
  });
});
