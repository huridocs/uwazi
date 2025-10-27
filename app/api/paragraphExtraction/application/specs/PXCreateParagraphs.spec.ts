/* eslint-disable max-statements */
import { ObjectId } from 'mongodb';

import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { createMockLogger } from 'api/core/libs/logger/infrastructure/MockLogger';
import { EntityStatus } from 'api/paragraphExtraction/domain/PXEntityStatusModel';
import { PXValidationError } from 'api/paragraphExtraction/domain/PXValidationError';
import { MongoPXExtractorDBO } from 'api/paragraphExtraction/infrastructure/MongoPXExtractorDBO';
import { mongoPXExtractorsCollection } from 'api/paragraphExtraction/infrastructure/MongoPXExtractorsDataSource';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { EntitySchema } from 'shared/types/entityType';

import { mongoPXEntitiesStatusCollection } from 'api/paragraphExtraction/infrastructure/MongoPXEntitiesStatusDataSource';
import { MongoPXEntityStatusDBO } from 'api/paragraphExtraction/infrastructure/MongoPXEntityStatusDBO';
import { PXEntitiesStatusDataSourceFactory } from 'api/paragraphExtraction/infrastructure/PXEntityStatusDataSourceFactory';
import { PXExtractorsDataSourceFactory } from 'api/paragraphExtraction/infrastructure/PXExtractorsDataSourceFactory';

import { PXCreateParagraphs, PXCreateParagraphsInput } from '../PXCreateParagraphs';

const factory = getFixturesFactory();

const sourceRelationshipType = {
  _id: factory.id('sourceRelationshipType'),
  name: 'Source Relationship Type',
  properties: [],
};

const targetRelationshipType = {
  _id: factory.id('targetRelationshipType'),
  name: 'Target Relationship Type',
  properties: [],
};

const paragraphProperty = factory.property('extracted_paragraph', 'markdown', {
  label: 'Extracted Paragraph',
});
const paragraphNumberProperty = factory.property('paragraph_number_property', 'numeric', {
  label: 'Paragraph number',
});

const textProperty = factory.property('text_property', 'text');

const template = factory.template('default template');

const sourceTemplate = factory.template('Source Template');

const relationshipProperty = factory.property('paragraph_to_source_entity', 'relationship', {
  content: sourceTemplate._id.toString(),
  relationType: sourceRelationshipType._id.toString(),
});

const targetTemplate = factory.template('Target Template', [
  paragraphProperty,
  paragraphNumberProperty,
  textProperty,
  relationshipProperty,
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
  paragraphNumberPropertyId: paragraphNumberProperty._id as ObjectId,
  paragraphPropertyId: paragraphProperty._id as ObjectId,
  sourceRelationshipTypeId: sourceRelationshipType._id,
  targetRelationshipTypeId: targetRelationshipType._id,
};

const mongoEntityStatus: MongoPXEntityStatusDBO = {
  _id: factory.id('entity_status'),
  extractorId: extractor._id,
  entitySharedId: entityEn.sharedId!,
  status: EntityStatus.Processing,
};

const createFixtures = (): DBFixture => ({
  relationtypes: [sourceRelationshipType, targetRelationshipType],
  [mongoPXExtractorsCollection]: [extractor],
  [mongoPXEntitiesStatusCollection]: [mongoEntityStatus],
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
  const connection = getConnection();
  const mongoTransactionManager = TransactionManagerFactory.default();
  const extractorsDS = PXExtractorsDataSourceFactory.createDefault({
    connection,
    mongoTransactionManager,
  });
  const entitiesStatusDS = PXEntitiesStatusDataSourceFactory.createDefault({
    connection,
    mongoTransactionManager,
  });

  const createParagraphs = new PXCreateParagraphs({
    extractorsDS,
    entitiesStatusDS,
  });
  (createParagraphs.createParagraph as any).dependencies.logger = createMockLogger();

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
    extracted_paragraph: [{ value: text }],
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

    const input: PXCreateParagraphsInput = {
      entityStatusId: mongoEntityStatus._id.toString(),
      userId: new ObjectId().toString(),
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

    const { userId } = input;

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

  it('should create a relationship between Paragraph and source Entity for each Paragraph', async () => {
    const { createParagraphs } = setUpUseCase();

    const input: PXCreateParagraphsInput = {
      entityStatusId: mongoEntityStatus._id.toString(),
      userId: new ObjectId().toString(),
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
    const [paragraphOne, paragraphTwo] = filterAndSortParagraphs(extractedParagraphs, 'en');

    const relationships = await testingEnvironment.db.getAllFrom('connections');

    const hubs = relationships?.reduce((_prev, relationship) => {
      const prev = _prev;
      if (!prev[relationship.hub.toString()]) {
        prev[relationship.hub.toString()] = {};
      }

      let type = 'undefined';
      if (relationship.entity === entityEn.sharedId) {
        type = 'source';
      }

      if ([paragraphOne.sharedId, paragraphTwo.sharedId].includes(relationship.entity)) {
        type = 'target';
      }

      prev[relationship.hub.toString()][type] = relationship;

      return prev;
    }, {} as any);

    expect(Object.keys(hubs).length).toBe(2);

    const [hubOne, hubTwo] = Object.values(hubs) as any;

    expect(hubOne.source.template.toString()).toBe(sourceRelationshipType._id.toString());
    expect(hubOne.target.template.toString()).toBe(targetRelationshipType._id.toString());
    expect(hubTwo.source.template.toString()).toBe(sourceRelationshipType._id.toString());
    expect(hubTwo.target.template.toString()).toBe(targetRelationshipType._id.toString());

    expect(paragraphOne.metadata![relationshipProperty.name]).toMatchObject([
      {
        value: 'Source Entity',
        label: 'Source Entity English',
        type: 'entity',
      },
    ]);

    expect(paragraphTwo.metadata![relationshipProperty.name]).toMatchObject([
      {
        value: 'Source Entity',
        label: 'Source Entity English',
        type: 'entity',
      },
    ]);
  });

  it('should persist Paragraph text and number according to the Extractor configuration', async () => {
    const _targetTemplate = {
      ...targetTemplate,
      properties: [
        textProperty,
        factory.property('paragraph', 'markdown', { label: 'Paragraph' }),
        factory.property('paragraph_number', 'numeric', { label: 'Paragraph Number' }),
      ],
    };

    const _extractor = {
      ...extractor,
      paragraphNumberPropertyId: _targetTemplate.properties[2]._id,
      paragraphPropertyId: _targetTemplate.properties[1]._id,
    };

    await testingEnvironment.setFixtures({
      ...createFixtures(),
      templates: [sourceTemplate, _targetTemplate, template],
      [mongoPXExtractorsCollection]: [_extractor],
    });

    const { createParagraphs } = setUpUseCase();

    const input: PXCreateParagraphsInput = {
      entityStatusId: mongoEntityStatus._id.toString(),
      userId: new ObjectId().toString(),
      paragraphs: [
        {
          paragraphNumber: 1,
          translations: [
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
    const extractedParagraphsEs = filterAndSortParagraphs(extractedParagraphs, 'es');

    expect(extractedParagraphsEs).toMatchObject([
      {
        ...createExpectedParagraph(
          'Source Entity Spanish.01',
          'es',
          'Paragraph 1 in spanish',
          input.userId
        ),
        metadata: {
          paragraph: [{ value: 'Paragraph 1 in spanish' }],
          paragraph_number: [{ value: 1 }],
        },
      },
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

    const input: PXCreateParagraphsInput = {
      entityStatusId: mongoEntityStatus._id.toString(),
      userId: new ObjectId().toString(),
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
        input.userId
      ),
    ]);
  });

  it('should fallback to main language if there are no translation available for the Entity', async () => {
    const { createParagraphs } = setUpUseCase();

    await testingEnvironment.setFixtures({
      ...createFixtures(),
      entities: [entityEn, entityEs, entityPt],
      settings: [
        {
          languages: [
            { label: 'Spanish', key: 'es', default: true },
            { label: 'Portuguese', key: 'pt' },
            { label: 'English', key: 'en' },
          ],
        },
      ],
    });

    const input: PXCreateParagraphsInput = {
      entityStatusId: mongoEntityStatus._id.toString(),
      userId: new ObjectId().toString(),
      paragraphs: [
        {
          paragraphNumber: 1,
          translations: [
            {
              isMainLanguage: false,
              language: 'en',
              needsUserReview: false,
              text: '',
            },
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
    const extractedEnglish = filterAndSortParagraphs(extractedParagraphs, 'en');

    expect(extractedEnglish).toMatchObject([
      createExpectedParagraph(
        'Source Entity English.01',
        'en',
        'Paragraph 1 in Portuguese',
        input.userId
      ),
    ]);

    expect(extractedSpanish).toMatchObject([
      createExpectedParagraph(
        'Source Entity Spanish.01',
        'es',
        'Paragraph 1 in Portuguese',
        input.userId
      ),
    ]);

    expect(extractedPortuguese).toMatchObject([
      createExpectedParagraph(
        'Source Entity Portuguese.01',
        'pt',
        'Paragraph 1 in Portuguese',
        input.userId
      ),
    ]);
  });

  it('should mark EntityStatus as processed after all Paragraphs created', async () => {
    const { createParagraphs } = setUpUseCase();

    const input: PXCreateParagraphsInput = {
      entityStatusId: mongoEntityStatus._id.toString(),
      userId: new ObjectId().toString(),
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

    const mongoEntitiesStatus = await testingEnvironment.db.getAllFrom(
      mongoPXEntitiesStatusCollection
    );

    expect(mongoEntitiesStatus).toMatchObject([
      {
        _id: expect.any(ObjectId),
        entitySharedId: mongoEntityStatus.entitySharedId,
        extractorId: mongoEntityStatus.extractorId,
        status: EntityStatus.Processed,
      },
    ]);
  });

  it('should mark EntityStatus as obsolete if previous value is processing_obsolete', async () => {
    await testingEnvironment.setFixtures({
      ...createFixtures(),
      [mongoPXEntitiesStatusCollection]: [
        { ...mongoEntityStatus, status: EntityStatus.ProcessingObsolete },
      ],
    });
    const { createParagraphs } = setUpUseCase();

    const input: PXCreateParagraphsInput = {
      entityStatusId: mongoEntityStatus._id.toString(),
      userId: new ObjectId().toString(),
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

    const mongoEntitiesStatus = await testingEnvironment.db.getAllFrom(
      mongoPXEntitiesStatusCollection
    );

    expect(mongoEntitiesStatus).toMatchObject([
      {
        _id: expect.any(ObjectId),
        entitySharedId: mongoEntityStatus.entitySharedId,
        extractorId: mongoEntityStatus.extractorId,
        status: EntityStatus.Obsolete,
      },
    ]);
  });

  it('should throw if the source Entity does not exist', async () => {
    const { createParagraphs } = setUpUseCase();

    await testingEnvironment.setFixtures({
      ...createFixtures(),
      entities: [sourceEntityThatDoesNotBelongToExtractor],
    });

    const input: PXCreateParagraphsInput = {
      entityStatusId: mongoEntityStatus._id.toString(),
      userId: new ObjectId().toString(),
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

    const input: PXCreateParagraphsInput = {
      entityStatusId: mongoEntityStatus._id.toString(),
      userId: new ObjectId().toString(),
      paragraphs: [],
    };

    const promise = createParagraphs.execute(input);

    await expect(promise).rejects.toMatchObject({
      code: PXValidationError.codes.EXTRACTOR_NOT_FOUND,
    });
  });

  it('should execute onParagraphCreated callback on each paragraph creation', async () => {
    const { createParagraphs } = setUpUseCase();

    const input: PXCreateParagraphsInput = {
      entityStatusId: mongoEntityStatus._id.toString(),
      userId: new ObjectId().toString(),
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
      onParagraphCreated: jest.fn(),
    };

    await createParagraphs.execute(input);

    expect(input.onParagraphCreated).toHaveBeenCalledTimes(input.paragraphs.length);
  });
});
