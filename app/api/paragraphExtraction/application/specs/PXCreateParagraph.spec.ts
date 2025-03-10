import { ObjectId } from 'mongodb';

import { testingEnvironment } from 'api/utils/testingEnvironment';
import {
  mongoPXExtractorsCollection,
  MongoPXExtractorsDataSource,
} from 'api/paragraphExtraction/infrastructure/MongoPXExtractorsDataSource';
import {
  mongoPXExtractionsCollection,
  MongoPXExtractionsDataSource,
} from 'api/paragraphExtraction/infrastructure/MongoPXExtractionsDataSource';
import { MongoPXExtractorDBO } from 'api/paragraphExtraction/infrastructure/MongoPXExtractorDBO';
import { MongoPXExtractionDBO } from 'api/paragraphExtraction/infrastructure/MongoPXExtractionDBO';
import { ExtractionStatus } from 'api/paragraphExtraction/domain/PXExtraction';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { createMockLogger } from 'api/log.v2/infrastructure/MockLogger';
import { DBFixture } from 'api/utils/testing_db';

import { LegacyEntitiesDS, PXCreateParagraph, PXCreateParagraphInput } from '../PXCreateParagraph';

const factory = getFixturesFactory();

const paragraphProperty = factory.property('extracted_paragraph', 'markdown', {
  label: 'Extracted Paragraph',
});
const paragraphNumberProperty = factory.property('paragraph_number_property', 'numeric', {
  label: 'Paragraph number',
});
const textProperty = factory.property('text_property', 'text');

const sourceTemplate = factory.template('Source Template');

const targetTemplate = factory.template('Target Template', [
  paragraphProperty,
  paragraphNumberProperty,
  textProperty,
]);

const entityEn = factory.entity(
  'Source Entity',
  sourceTemplate.name,
  {},
  {
    title: 'Source Entity English',
  }
);

const entityEs = factory.entity(
  'Source Entity',
  sourceTemplate.name,
  {},
  { language: 'es', title: 'Source Entity Spanish' }
);

const entityPt = factory.entity(
  'Source Entity',
  sourceTemplate.name,
  {},
  { language: 'pt', title: 'Source Entity Portuguese' }
);

const extractorDBO: MongoPXExtractorDBO = {
  _id: factory.id('extractor'),
  sourceTemplateId: sourceTemplate._id,
  targetTemplateId: targetTemplate._id,
  paragraphNumberPropertyId: paragraphNumberProperty._id as ObjectId,
  paragraphPropertyId: paragraphProperty._id as ObjectId,
};

const extractor = MongoPXExtractorsDataSource.toDomain({
  ...extractorDBO,
  sourceTemplate: sourceTemplate as any,
  targetTemplate: targetTemplate as any,
});

const extractionDBO: MongoPXExtractionDBO = {
  _id: factory.id('extractionDBO'),
  extractorId: extractorDBO._id,
  entitySharedId: entityEn.sharedId!,
  status: ExtractionStatus.Processing,
  paragraphsCount: 2,
  failedParagraphsCount: 0,
  successfulParagraphsCount: 0,
};

const extraction = MongoPXExtractionsDataSource.toDomain(extractionDBO);

const setUpUseCase = (entitiesDS?: LegacyEntitiesDS) => {
  const connection = getConnection();
  const transaction = DefaultTransactionManager();

  const extractionsDS = new MongoPXExtractionsDataSource(connection, transaction);

  const createParagraph = new PXCreateParagraph({
    logger: createMockLogger(),
    extractionsDS,
    entitiesDS,
  });

  return { createParagraph };
};

const createFixtures = (): DBFixture => ({
  [mongoPXExtractorsCollection]: [extractorDBO],
  [mongoPXExtractionsCollection]: [extractionDBO],
  templates: [sourceTemplate, targetTemplate],
  entities: [entityEn, entityEs, entityPt],
  settings: [
    {
      languages: [
        { label: 'English', key: 'en' },
        { label: 'Portuguese', key: 'pt' },
        { label: 'Spanish', key: 'es', default: true },
      ],
    },
  ],
});

describe('PXCreateParagraph', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(createFixtures());
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should increment successfulParagraphsCount if a Paragraph is created with success', async () => {
    const { createParagraph } = setUpUseCase();

    const input: PXCreateParagraphInput = {
      extraction,
      user: new ObjectId(),
      extractor,
      sourceEntities: [entityEn, entityEs, entityPt],
      paragraph: {
        paragraphNumber: 1,
        translations: [
          {
            isMainLanguage: true,
            language: 'es',
            text: 'Paragraph in Spanish',
            needsUserReview: false,
          },
          {
            isMainLanguage: false,
            language: 'pt',
            text: 'Paragraph in Portuguese',
            needsUserReview: false,
          },
          {
            isMainLanguage: false,
            language: 'en',
            text: 'Paragraph in English',
            needsUserReview: false,
          },
        ],
      },
    };

    await createParagraph.execute(input);

    const extractions = await testingEnvironment.db.getAllFrom(mongoPXExtractionsCollection);

    expect(extractions).toMatchObject([
      {
        _id: extractionDBO._id,
        successfulParagraphsCount: 1,
      },
    ]);
  });

  it('should increment failedParagraphsCount if a Paragraph is not created', async () => {
    const entitiesDS: LegacyEntitiesDS = {
      save: jest.fn().mockRejectedValue(new Error('any error')),
    } as any;

    const { createParagraph } = setUpUseCase(entitiesDS);

    const input: PXCreateParagraphInput = {
      extraction,
      user: new ObjectId(),
      extractor,
      sourceEntities: [entityEn, entityEs, entityPt],
      paragraph: {
        paragraphNumber: 1,
        translations: [
          {
            isMainLanguage: true,
            language: 'es',
            text: 'Paragraph in Spanish',
            needsUserReview: false,
          },
          {
            isMainLanguage: false,
            language: 'pt',
            text: 'Paragraph in Portuguese',
            needsUserReview: false,
          },
          {
            isMainLanguage: false,
            language: 'en',
            text: 'Paragraph in English',
            needsUserReview: false,
          },
        ],
      },
    };

    const promise = createParagraph.execute(input);

    await expect(promise).rejects.toThrow();

    const extractions = await testingEnvironment.db.getAllFrom(mongoPXExtractionsCollection);

    expect(extractions).toMatchObject([
      {
        _id: extractionDBO._id,
        failedParagraphsCount: 1,
      },
    ]);
  });
});
