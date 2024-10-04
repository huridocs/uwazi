import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { DefaultEntitiesDataSource } from 'api/entities.v2/database/data_source_defaults';
import { DefaultTemplatesDataSource } from 'api/templates.v2/database/data_source_defaults';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import testingDB, { DBFixture } from 'api/utils/testing_db';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { createMockLogger } from 'api/log.v2/infrastructure/MockLogger';
import { Logger } from 'api/log.v2/contracts/Logger';
import { SaveEntityTranslations } from '../SaveEntityTranslations';
import { TranslationResult, translationResultSchema } from '../types/TranslationResult';
import { ValidationError, Validator } from '../infrastructure/Validator';

const factory = getFixturesFactory();

beforeEach(async () => {
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
  await testingEnvironment.setUp(fixtures);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('GenerateAutomaticTranslationConfig', () => {
  let saveEntityTranslations: SaveEntityTranslations;
  let mockLogger: Logger;

  beforeEach(() => {
    const transactionManager = DefaultTransactionManager();
    mockLogger = createMockLogger();
    saveEntityTranslations = new SaveEntityTranslations(
      DefaultTemplatesDataSource(transactionManager),
      DefaultEntitiesDataSource(transactionManager),
      new Validator<TranslationResult>(translationResultSchema),
      mockLogger
    );
  });

  it('should validate input has proper shape at runtime', async () => {
    const invalidConfig = { invalid_prop: true };
    await expect(saveEntityTranslations.execute(invalidConfig)).rejects.toEqual(
      new ValidationError('must NOT have additional properties')
    );
  });

  it(`should save entity with translated text with prepended "${SaveEntityTranslations.AITranslatedText}"`, async () => {
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

    const entities =
      (await testingDB.mongodb?.collection('entities').find({ sharedId: 'entity' }).toArray()) ||
      [];

    expect(entities.find(e => e.language === 'es')).toMatchObject({
      metadata: {
        propertyName: [{ value: `${SaveEntityTranslations.AITranslatedText} texto original` }],
      },
    });

    expect(entities.find(e => e.language === 'pt')).toMatchObject({
      metadata: {
        propertyName: [{ value: `${SaveEntityTranslations.AITranslatedText} texto original (pt)` }],
      },
    });

    expect(entities.find(e => e.language === 'en')).toMatchObject({
      metadata: { propertyName: [{ value: 'original text' }] },
    });
  });

  it('should save translated common properties (title)', async () => {
    const translationResult: TranslationResult = {
      key: ['tenant', 'entity', factory.commonPropertiesTitleId('template1')],
      text: 'entity',
      language_from: 'en',
      languages_to: ['es', 'pt'],
      translations: [
        { text: 'titulo original', language: 'es', success: true, error_message: '' },
        { text: 'titulo original (pt)', language: 'pt', success: true, error_message: '' },
      ],
    };

    await saveEntityTranslations.execute(translationResult);

    const entities =
      (await testingDB.mongodb?.collection('entities').find({ sharedId: 'entity' }).toArray()) ||
      [];

    expect(entities.find(e => e.language === 'es')).toMatchObject({
      title: `${SaveEntityTranslations.AITranslatedText} titulo original`,
    });

    expect(entities.find(e => e.language === 'pt')).toMatchObject({
      title: `${SaveEntityTranslations.AITranslatedText} titulo original (pt)`,
    });

    expect(entities.find(e => e.language === 'en')).toMatchObject({
      title: 'entity',
    });
  });

  it('should denormalize text property on related entities', async () => {
    const fixtures: DBFixture = {
      settings: [
        {
          languages: [{ label: 'es', key: 'es' as LanguageISO6391, default: true }],
        },
      ],
      templates: [
        factory.template('templateA', [factory.inherit('relationship', 'templateB', 'text')]),
        factory.template('templateB', [factory.property('text')]),
      ],
      entities: [
        factory.entity('A1', 'templateA', {
          relationship: [factory.metadataValue('B1')],
        }),
        factory.entity('B1', 'templateB', {}, { title: 'B1title' }),
      ],
    };

    await testingEnvironment.setUp(fixtures);

    const translationResult: TranslationResult = {
      key: ['tenant', 'B1', factory.idString('text')],
      text: 'texto original',
      language_from: 'es',
      languages_to: ['en'],
      translations: [{ text: 'original text', language: 'en', success: true, error_message: '' }],
    };

    await saveEntityTranslations.execute(translationResult);

    const entities = (await testingDB.mongodb?.collection('entities').find().toArray()) || [];

    expect(entities).toMatchObject([
      {
        sharedId: 'A1',
        metadata: {
          relationship: [
            {
              value: 'B1',
              label: 'B1title',
              inheritedValue: [
                { value: `${SaveEntityTranslations.AITranslatedText} original text` },
              ],
            },
          ],
        },
      },
      {
        title: 'B1title',
        sharedId: 'B1',
        metadata: {
          text: [{ value: `${SaveEntityTranslations.AITranslatedText} original text` }],
        },
      },
    ]);
  });

  it('should call Logger.info two times', async () => {
    const translationResult: TranslationResult = {
      key: ['tenant', 'entity', factory.commonPropertiesTitleId('template1')],
      text: 'entity',
      language_from: 'en',
      languages_to: ['es', 'pt'],
      translations: [
        { text: 'titulo original', language: 'es', success: true, error_message: '' },
        { text: 'titulo original (pt)', language: 'pt', success: true, error_message: '' },
      ],
    };

    await saveEntityTranslations.execute(translationResult);

    expect(mockLogger.info).toHaveBeenCalledTimes(2);
  });
});
