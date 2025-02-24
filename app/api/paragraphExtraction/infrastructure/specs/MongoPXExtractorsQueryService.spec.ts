import { ObjectId } from 'mongodb';

import { testingEnvironment } from 'api/utils/testingEnvironment';
import { DBFixture } from 'api/utils/testing_db';
import { MongoPXExtractorDBO } from 'api/paragraphExtraction/infrastructure/MongoPXExtractorDBO';
import { mongoPXExtractorsCollection } from 'api/paragraphExtraction/infrastructure/MongoPXExtractorsDataSource';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';

import { MongoPXExtractorsQueryService } from '../MongoPXExtractorsQueryService';

const factory = getFixturesFactory();
const sourceTemplate = factory.template('Source Template');
const targetTemplate = factory.template('Target Template');
const template = factory.template('Template');
const paragraphProperty = factory.property('rich_text', 'markdown');
const paragraphNumberProperty = factory.property('paragraph_number_property', 'numeric');

const extractor: MongoPXExtractorDBO = {
  _id: factory.id('extractor'),
  sourceTemplateId: sourceTemplate._id,
  targetTemplateId: targetTemplate._id,
  paragraphNumberPropertyId: paragraphNumberProperty._id as ObjectId,
  paragraphPropertyId: paragraphProperty._id as ObjectId,
};

const entity = factory.entity('entity', sourceTemplate.name);
const entityPt = factory.entity('entity', sourceTemplate.name, {}, { language: 'pt' });

const entity2 = factory.entity('entity2', sourceTemplate.name);
const entity2Pt = factory.entity('entity2', sourceTemplate.name, {}, { language: 'pt' });

const entityThatDoesNotBelongToExtractor = factory.entity(
  'entityThatDoesNotBelongToExtractor',
  template.name
);

const createFixtures = (): DBFixture => ({
  [mongoPXExtractorsCollection]: [extractor],
  templates: [sourceTemplate, targetTemplate],
  entities: [entity, entity2, entityPt, entity2Pt, entityThatDoesNotBelongToExtractor],
  settings: [
    {
      languages: [
        { label: 'English', key: 'en', default: true },
        { label: 'Portuguese', key: 'pt' },
      ],
    },
  ],
});

const setUpSut = () => {
  const db = getConnection();
  const transaction = DefaultTransactionManager();

  const extractorsQueryService = new MongoPXExtractorsQueryService(db, transaction);

  return {
    extractorsQueryService,
  };
};

describe('MongoPXExtractorsQueryService', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(createFixtures());
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });
  it('should return target and source', async () => {
    const { extractorsQueryService } = setUpSut();

    const extractors = await extractorsQueryService.getExtractors({}).all();

    expect(extractors).toMatchObject([
      {
        sourceTemplate: {
          templateId: sourceTemplate._id,
          name: sourceTemplate.name,
        },
        targetTemplate: {
          templateId: targetTemplate._id,
          name: targetTemplate.name,
        },
      },
    ]);
  });

  it('should count source Entities to be extracted which belongs to Extractor', async () => {
    const { extractorsQueryService } = setUpSut();

    const extractors = await extractorsQueryService.getExtractors({}).all();

    expect(extractors).toMatchObject([
      {
        sourceEntitiesCount: 2,
      },
    ]);
  });

  it.todo('should count source Entities that has never been extracted');
});
