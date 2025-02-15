import { MongoPXExtractorDBO } from 'api/paragraphExtraction/infrastructure/MongoPXExtractorDBO';
import { mongoPXExtractorsCollection } from 'api/paragraphExtraction/infrastructure/MongoPXExtractorsDataSource';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { PXExtractionId } from 'api/paragraphExtraction/domain/PXExtractionId';

import { PXCreateParagraphsInput, PXCreateParagraphs } from '../PXCreateParagraphs';

const factory = getFixturesFactory();

const sourceTemplate = factory.template('Source Template');

const targetTemplate = factory.template('Target Template', [
  factory.property('extracted_text', 'markdown'),
]);

const entity = factory.entity('Source Entity', sourceTemplate.name);

const extractor: MongoPXExtractorDBO = {
  _id: factory.id('extractor'),
  sourceTemplateId: sourceTemplate._id,
  targetTemplateId: targetTemplate._id,
};

const createFixtures = (): DBFixture => ({
  [mongoPXExtractorsCollection]: [extractor],
  templates: [sourceTemplate, targetTemplate],
  entities: [entity],
  settings: [
    {
      languages: [
        { label: 'English', key: 'en', default: true },
        { label: 'Spanish', key: 'es' },
      ],
    },
  ],
});

describe('PXCreateParagraphs', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(createFixtures());
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should create an Entity per paragraph with available translations', async () => {
    const createParagraphs = new PXCreateParagraphs({});

    const input: PXCreateParagraphsInput = {
      availableLanguages: ['en', 'es'],
      mainLanguage: 'en',
      extractionId: PXExtractionId.create({
        entitySharedId: entity.sharedId!,
        extractorId: extractor._id.toString(),
      }),
      paragraphs: [
        {
          pageNumber: 1,
          translations: [
            { language: 'en', needsUserReview: false, paragraph: 'Paragraph 1 in english' },
            { language: 'es', needsUserReview: false, paragraph: 'Paragraph 1 is spanish' },
          ],
        },
      ],
    };

    await createParagraphs.execute(input);

    const extractedParagraphs = (await testingEnvironment.db.getAllFrom('entities'))?.filter(
      item => item.template.toString() === targetTemplate._id.toString()
    );

    expect(extractedParagraphs).toMatchObject([
      {
        title: 'Source Entity.1',
        language: 'en',
        metadata: {
          extracted_text: [{ value: 'Paragraph 1 in english' }],
        },
      },
      {
        title: 'Source Entity.1',
        language: 'es',
        metadata: {
          extracted_text: [{ value: 'Paragraph 1 in spanish' }],
        },
      },
    ]);

    // Extracted Paragraphs needs to be grouped by sharedId and tested in clusters
  });
});
