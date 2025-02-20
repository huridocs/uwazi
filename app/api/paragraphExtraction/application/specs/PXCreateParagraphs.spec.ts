/* eslint-disable max-statements */
import { ObjectId } from 'mongodb';

import { tenants } from 'api/tenants';
import { MongoPXExtractorDBO } from 'api/paragraphExtraction/infrastructure/MongoPXExtractorDBO';
import {
  mongoPXExtractorsCollection,
  MongoPXExtractorsDataSource,
} from 'api/paragraphExtraction/infrastructure/MongoPXExtractorsDataSource';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { EntitySchema } from 'shared/types/entityType';
import { PXExtractionId } from 'api/paragraphExtraction/domain/PXExtractionId';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';
import { PXValidationError } from 'api/paragraphExtraction/domain/PXValidationError';

import { PXCreateParagraphsInput, PXCreateParagraphs } from '../PXCreateParagraphs';

const factory = getFixturesFactory();

const template = factory.template('default template');

const sourceTemplate = factory.template('Source Template');

const targetTemplate = factory.template('Target Template', [
  factory.property('extracted_paragraph', 'markdown', { label: 'Extracted Paragraph' }),
]);

const sourceEntityThatDoesNotBelongToExtractor = factory.entity(
  'sourceEntityThatDoesNotBelongToExtractor',
  template.name,
  {},
  {
    title: 'Source Entity that does not belong to Extractor',
  }
);

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

const extractor: MongoPXExtractorDBO = {
  _id: factory.id('extractor'),
  sourceTemplateId: sourceTemplate._id,
  targetTemplateId: targetTemplate._id,
};

const createFixtures = (): DBFixture => ({
  [mongoPXExtractorsCollection]: [extractor],
  templates: [sourceTemplate, targetTemplate, template],
  entities: [entityEn, entityEs, entityPt, sourceEntityThatDoesNotBelongToExtractor],
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

const setUpUseCase = () => {
  const db = getConnection();
  const transaction = DefaultTransactionManager();
  const extractorsDS = new MongoPXExtractorsDataSource(db, transaction);

  const createParagraphs = new PXCreateParagraphs({
    extractorsDS,
    idGenerator: MongoIdHandler,
  });

  return { createParagraphs };
};

const filterAndSortParagraphs = (paragraphs: EntitySchema[], language: string) =>
  paragraphs
    ?.filter(item => item.language === language)
    .sort((a, b) => a.title!.localeCompare(b.title!));

const getExtractedParagraphs = async () => {
  const extractedParagraphs = (await testingEnvironment.db.getAllFrom('entities'))?.filter(
    item => item.template.toString() === targetTemplate._id.toString()
  ) as EntitySchema[];
  return extractedParagraphs;
};

const createExpectedParagraph = (
  title: string,
  language: string,
  text: string,
  userId: string
) => ({
  title,
  template: targetTemplate._id,
  language,
  metadata: {
    extracted_paragraph: [{ label: 'Extracted Paragraph', value: text }],
  },
  user: new ObjectId(userId),
  published: false,
});

describe('PXCreateParagraphs', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(createFixtures());
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should create an Entity per paragraph with available translations', async () => {
    const { createParagraphs } = setUpUseCase();

    const extractionId = PXExtractionId.create({
      entitySharedId: entityEn.sharedId!,
      extractorId: extractor._id.toString(),
      tenantName: tenants.current().name,
      userId: new ObjectId().toString(),
    });

    const input: PXCreateParagraphsInput = {
      availableLanguages: ['es', 'en', 'pt'],
      extractionId,
      mainLanguage: 'es',
      paragraphs: [
        {
          paragraphNumber: 1,
          translations: [
            {
              isMainLanguage: false,
              language: 'en',
              needsUserReview: false,
              text: 'Paragraph 1 in english',
            },
            {
              isMainLanguage: true,
              language: 'es',
              needsUserReview: false,
              text: 'Paragraph 1 in spanish',
            },
            {
              isMainLanguage: false,
              language: 'pt',
              needsUserReview: false,
              text: 'Paragraph 1 in portuguese',
            },
          ],
        },
        {
          paragraphNumber: 2,
          translations: [
            {
              isMainLanguage: false,
              language: 'en',
              needsUserReview: false,
              text: 'Paragraph 2 in english',
            },
            {
              isMainLanguage: true,
              language: 'es',
              needsUserReview: false,
              text: 'Paragraph 2 in spanish',
            },
            {
              isMainLanguage: false,
              language: 'pt',
              needsUserReview: false,
              text: 'Paragraph 2 in portuguese',
            },
          ],
        },
      ],
    };

    await createParagraphs.execute(input);

    const extractedParagraphs = await getExtractedParagraphs();
    const extractedEnglish = filterAndSortParagraphs(extractedParagraphs, 'en');
    const extractedSpanish = filterAndSortParagraphs(extractedParagraphs, 'es');
    const extractedPortuguese = filterAndSortParagraphs(extractedParagraphs, 'pt');

    const { userId } = extractionId;

    expect(extractedPortuguese).toMatchObject([
      createExpectedParagraph(
        'Source Entity Portuguese.01',
        'pt',
        'Paragraph 1 in portuguese',
        userId
      ),
      createExpectedParagraph(
        'Source Entity Portuguese.02',
        'pt',
        'Paragraph 2 in portuguese',
        userId
      ),
    ]);

    expect(extractedEnglish).toMatchObject([
      createExpectedParagraph('Source Entity English.01', 'en', 'Paragraph 1 in english', userId),
      createExpectedParagraph('Source Entity English.02', 'en', 'Paragraph 2 in english', userId),
    ]);

    expect(extractedSpanish).toMatchObject([
      createExpectedParagraph('Source Entity Spanish.01', 'es', 'Paragraph 1 in spanish', userId),
      createExpectedParagraph('Source Entity Spanish.02', 'es', 'Paragraph 2 in spanish', userId),
    ]);
  });
  it('should ignore Paragraph which languages does not exist anymore on settings Collection', async () => {
    const { createParagraphs } = setUpUseCase();

    await testingEnvironment.setFixtures({
      ...createFixtures(),
      entities: [entityEs],
      settings: [
        {
          languages: [{ label: 'Spanish', key: 'es', default: true }],
        },
      ],
    });

    const extractionId = PXExtractionId.create({
      entitySharedId: entityEn.sharedId!,
      extractorId: extractor._id.toString(),
      tenantName: tenants.current().name,
      userId: new ObjectId().toString(),
    });

    const input: PXCreateParagraphsInput = {
      availableLanguages: ['es', 'en'],
      extractionId,
      mainLanguage: 'es',
      paragraphs: [
        {
          paragraphNumber: 1,
          translations: [
            {
              isMainLanguage: false,
              language: 'en',
              needsUserReview: false,
              text: 'Paragraph 1 in english',
            },
            {
              isMainLanguage: true,
              language: 'es',
              needsUserReview: false,
              text: 'Paragraph 1 in spanish',
            },
          ],
        },
      ],
    };

    await createParagraphs.execute(input);

    const extractedParagraphs = await getExtractedParagraphs();

    expect(extractedParagraphs).toMatchObject([
      createExpectedParagraph(
        'Source Entity Spanish.01',
        'es',
        'Paragraph 1 in spanish',
        extractionId.userId
      ),
    ]);
  });

  it('should fallback to main language if there are no translation available for the Entity', async () => {
    const { createParagraphs } = setUpUseCase();

    await testingEnvironment.setFixtures({
      ...createFixtures(),
      entities: [entityEs, entityPt],
      settings: [
        {
          languages: [
            { label: 'Spanish', key: 'es', default: true },
            { label: 'Portuguese', key: 'pt' },
          ],
        },
      ],
    });

    const extractionId = PXExtractionId.create({
      entitySharedId: entityEn.sharedId!,
      extractorId: extractor._id.toString(),
      tenantName: tenants.current().name,
      userId: new ObjectId().toString(),
    });

    const input: PXCreateParagraphsInput = {
      availableLanguages: ['pt'],
      extractionId,
      mainLanguage: 'pt',
      paragraphs: [
        {
          paragraphNumber: 1,
          translations: [
            {
              isMainLanguage: true,
              language: 'pt',
              needsUserReview: false,
              text: 'Paragraph 1 in Portuguese',
            },
          ],
        },
      ],
    };

    await createParagraphs.execute(input);

    const extractedParagraphs = await getExtractedParagraphs();
    const extractedSpanish = filterAndSortParagraphs(extractedParagraphs, 'es');
    const extractedPortuguese = filterAndSortParagraphs(extractedParagraphs, 'pt');

    expect(extractedSpanish).toMatchObject([
      createExpectedParagraph(
        'Source Entity Spanish.01',
        'es',
        'Paragraph 1 in Portuguese',
        extractionId.userId
      ),
    ]);

    expect(extractedPortuguese).toMatchObject([
      createExpectedParagraph(
        'Source Entity Portuguese.01',
        'pt',
        'Paragraph 1 in Portuguese',
        extractionId.userId
      ),
    ]);
  });

  it('should throw if the source Entity does not exist', async () => {
    const { createParagraphs } = setUpUseCase();

    await testingEnvironment.setFixtures({
      ...createFixtures(),
      entities: [sourceEntityThatDoesNotBelongToExtractor],
    });

    const extractionId = PXExtractionId.create({
      entitySharedId: entityEn.sharedId!,
      extractorId: extractor._id.toString(),
      tenantName: tenants.current().name,
      userId: new ObjectId().toString(),
    });

    const input: PXCreateParagraphsInput = {
      availableLanguages: ['pt'],
      extractionId,
      mainLanguage: 'pt',
      paragraphs: [],
    };

    const promise = createParagraphs.execute(input);

    await expect(promise).rejects.toMatchObject({
      code: PXValidationError.codes.SOURCE_ENTITY_DOES_NOT_EXIST_ANYMORE,
    });
  });

  it('should throw if the Extractor does not exist', async () => {
    const { createParagraphs } = setUpUseCase();

    await testingEnvironment.setFixtures({
      ...createFixtures(),
      [mongoPXExtractorsCollection]: [],
    });

    const extractionId = PXExtractionId.create({
      entitySharedId: entityEn.sharedId!,
      extractorId: extractor._id.toString(),
      tenantName: tenants.current().name,
      userId: new ObjectId().toString(),
    });

    const input: PXCreateParagraphsInput = {
      availableLanguages: ['pt'],
      extractionId,
      mainLanguage: 'pt',
      paragraphs: [],
    };

    const promise = createParagraphs.execute(input);

    await expect(promise).rejects.toMatchObject({
      code: PXValidationError.codes.EXTRACTOR_NOT_FOUND,
    });
  });

  it.todo('should inherit Properties from source Entity if target Template has inherit Properties');

  it.todo('should save Paragraph number as a Property of the created Entity Paragraph');

  it.todo('should throw if the source Entity does not belong to the Extractor');
  it.todo('should pick the first rich text property if target Template has more than one');
});
