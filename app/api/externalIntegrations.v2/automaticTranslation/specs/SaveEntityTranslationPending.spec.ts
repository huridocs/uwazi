import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { DefaultEntitiesDataSource } from 'api/entities.v2/database/data_source_defaults';
import { DefaultTemplatesDataSource } from 'api/templates.v2/database/data_source_defaults';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import testingDB, { DBFixture } from 'api/utils/testing_db';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { createMockLogger } from 'api/log.v2/infrastructure/MockLogger';
import { Logger } from 'api/log.v2/contracts/Logger';
import { SaveEntityTranslationPending } from '../SaveEntityTranslationPending';
import { ValidationError } from '../infrastructure/Validator';
import { saveEntityFixtures } from './fixtures/SaveEntity.fixtures';

const factory = getFixturesFactory();

beforeEach(async () => {
  const fixtures = saveEntityFixtures(factory);
  await testingEnvironment.setUp(fixtures);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('SaveEntityTranslationPending', () => {
  let saveEntityTranslationPending: SaveEntityTranslationPending;
  let mockLogger: Logger;

  beforeEach(() => {
    const transactionManager = DefaultTransactionManager();
    mockLogger = createMockLogger();
    saveEntityTranslationPending = new SaveEntityTranslationPending(
      DefaultTemplatesDataSource(transactionManager),
      DefaultEntitiesDataSource(transactionManager),
      mockLogger
    );
  });

  it('should validate inputs have proper shape at runtime', async () => {
    await expect(
      saveEntityTranslationPending.execute('invalidSharedId', 'propId', 'originalText', 'en')
    ).rejects.toEqual(
      new ValidationError(
        "[AT] Translation-pending entity 'invalidSharedId' does not exist for language 'en'"
      )
    );

    await expect(
      saveEntityTranslationPending.execute(
        'entity_with_wrong_template',
        'propId',
        'originalText',
        'en'
      )
    ).rejects.toEqual(
      new ValidationError(
        `[AT] Translation-pending template does not exist: ${factory.idString('wrong_template')}`
      )
    );

    await expect(
      saveEntityTranslationPending.execute('entity', 'invalidProp', 'originalText', 'en')
    ).rejects.toEqual(
      new ValidationError('[AT] Translation-pending property does not exist: invalidProp')
    );
  });

  it(`should save entity with original text prepended "${SaveEntityTranslationPending.AITranslationPendingText}"`, async () => {
    await saveEntityTranslationPending.execute(
      'entity',
      factory.idString('propertyName'),
      'original text',
      'es'
    );

    const entities =
      (await testingDB.mongodb?.collection('entities').find({ sharedId: 'entity' }).toArray()) ||
      [];

    expect(entities.find(e => e.language === 'es')).toMatchObject({
      metadata: {
        propertyName: [
          { value: `${SaveEntityTranslationPending.AITranslationPendingText} original text` },
        ],
      },
    });

    expect(entities.find(e => e.language === 'pt')).toMatchObject({
      metadata: {
        propertyName: [{ value: 'original text' }],
      },
    });

    expect(entities.find(e => e.language === 'en')).toMatchObject({
      metadata: { propertyName: [{ value: 'original text' }] },
    });
  });

  it(`should save entity title with original text prepended "${SaveEntityTranslationPending.AITranslationPendingText}"`, async () => {
    await saveEntityTranslationPending.execute(
      'entity',
      factory.idString('commonPropertiestemplate1Title'),
      'entity',
      'es'
    );

    const entities =
      (await testingDB.mongodb?.collection('entities').find({ sharedId: 'entity' }).toArray()) ||
      [];

    expect(entities.find(e => e.language === 'es')).toMatchObject({
      title: `${SaveEntityTranslationPending.AITranslationPendingText} entity`,
    });

    expect(entities.find(e => e.language === 'pt')).toMatchObject({
      title: 'entity',
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

    await saveEntityTranslationPending.execute(
      'B1',
      factory.idString('text'),
      'texto original',
      'en'
    );

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
                {
                  value: `${SaveEntityTranslationPending.AITranslationPendingText} texto original`,
                },
              ],
            },
          ],
        },
      },
      {
        title: 'B1title',
        sharedId: 'B1',
        metadata: {
          text: [
            { value: `${SaveEntityTranslationPending.AITranslationPendingText} texto original` },
          ],
        },
      },
    ]);
  });

  it('should call Logger.info two times', async () => {
    await saveEntityTranslationPending.execute(
      'entity',
      factory.idString('propertyName'),
      'original text',
      'es'
    );

    expect(mockLogger.info).toHaveBeenCalledWith(
      '[AT] - Pending translation saved on DB - propertyName: (AI translation pending) original text'
    );
  });
});
