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
import { PXExtractionId } from 'api/paragraphExtraction/domain/PXExtractionId';

import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';

import { PXCreateParagraphsInput, PXCreateParagraphs } from '../PXCreateParagraphs';

const factory = getFixturesFactory();

const sourceTemplate = factory.template('Source Template');

const targetTemplate = factory.template('Target Template', [
  factory.property('extracted_paragraph', 'markdown', { label: 'Extracted Paragraph' }),
]);

const entityEn = factory.entity('Source Entity', sourceTemplate.name);
const entityEs = factory.entity('Source Entity', sourceTemplate.name, {}, { language: 'es' });
const entityPt = factory.entity('Source Entity', sourceTemplate.name, {}, { language: 'pt' });

const extractor: MongoPXExtractorDBO = {
  _id: factory.id('extractor'),
  sourceTemplateId: sourceTemplate._id,
  targetTemplateId: targetTemplate._id,
};

const createFixtures = (): DBFixture => ({
  [mongoPXExtractorsCollection]: [extractor],
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

describe('PXCreateParagraphs', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(createFixtures());
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  // eslint-disable-next-line max-statements
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
            { language: 'en', needsUserReview: false, text: 'Paragraph 1 in english' },
            { language: 'es', needsUserReview: false, text: 'Paragraph 1 in spanish' },
            { language: 'pt', needsUserReview: false, text: 'Paragraph 1 in portuguese' },
          ],
        },
        {
          paragraphNumber: 2,
          translations: [
            { language: 'en', needsUserReview: false, text: 'Paragraph 2 in english' },
            { language: 'es', needsUserReview: false, text: 'Paragraph 2 in spanish' },
            { language: 'pt', needsUserReview: false, text: 'Paragraph 2 in portuguese' },
          ],
        },
      ],
    };

    await createParagraphs.execute(input);

    const extractedParagraphs = (await testingEnvironment.db.getAllFrom('entities'))?.filter(
      item => item.template.toString() === targetTemplate._id.toString()
    );

    const extractedEnglish = extractedParagraphs
      ?.filter(item => item.language === 'en')
      .sort((a, b) => a.title.localeCompare(b.title));

    const extractedSpanish = extractedParagraphs
      ?.filter(item => item.language === 'es')
      .sort((a, b) => a.title.localeCompare(b.title));

    const extractedPortuguese = extractedParagraphs
      ?.filter(item => item.language === 'pt')
      .sort((a, b) => a.title.localeCompare(b.title));

    expect(extractedPortuguese).toMatchObject([
      {
        title: 'Source Entity.1',
        template: targetTemplate._id,
        language: 'pt',
        metadata: {
          extracted_paragraph: [
            { label: 'Extracted Paragraph', value: 'Paragraph 1 in portuguese' },
          ],
        },
        user: new ObjectId(extractionId.userId),
      },
      {
        title: 'Source Entity.2',
        template: targetTemplate._id,
        language: 'pt',
        metadata: {
          extracted_paragraph: [
            { label: 'Extracted Paragraph', value: 'Paragraph 2 in portuguese' },
          ],
        },
        user: new ObjectId(extractionId.userId),
      },
    ]);

    expect(extractedEnglish).toMatchObject([
      {
        title: 'Source Entity.1',
        template: targetTemplate._id,
        language: 'en',
        metadata: {
          extracted_paragraph: [{ label: 'Extracted Paragraph', value: 'Paragraph 1 in english' }],
        },
        user: new ObjectId(extractionId.userId),
      },
      {
        title: 'Source Entity.2',
        template: targetTemplate._id,
        language: 'en',
        metadata: {
          extracted_paragraph: [{ label: 'Extracted Paragraph', value: 'Paragraph 2 in english' }],
        },
        user: new ObjectId(extractionId.userId),
      },
    ]);

    expect(extractedSpanish).toMatchObject([
      {
        title: 'Source Entity.1',
        template: targetTemplate._id,
        language: 'es',
        metadata: {
          extracted_paragraph: [{ label: 'Extracted Paragraph', value: 'Paragraph 1 in spanish' }],
        },
        user: new ObjectId(extractionId.userId),
      },
      {
        title: 'Source Entity.2',
        template: targetTemplate._id,
        language: 'es',
        metadata: {
          extracted_paragraph: [{ label: 'Extracted Paragraph', value: 'Paragraph 2 in spanish' }],
        },
        user: new ObjectId(extractionId.userId),
      },
    ]);
  });
});
