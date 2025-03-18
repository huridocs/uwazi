import { ObjectId } from 'mongodb';

import { testingEnvironment } from 'api/utils/testingEnvironment';
import { DBFixture } from 'api/utils/testing_db';
import { MongoPXExtractorDBO } from 'api/paragraphExtraction/infrastructure/MongoPXExtractorDBO';
import { mongoPXExtractorsCollection } from 'api/paragraphExtraction/infrastructure/MongoPXExtractorsDataSource';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { EntityStatus } from 'api/paragraphExtraction/domain/PXEntityStatusModel';

import { MongoPXExtractorsQueryService } from '../MongoPXExtractorsQueryService';
import { mongoPXEntitiesStatusCollection } from '../MongoPXEntitiesStatusDataSource';
import { MongoPXEntityStatus } from '../MongoPXEntityStatus';

const factory = getFixturesFactory();
const sourceTemplate = factory.template('Source Template');
const sourceTemplate2 = factory.template('Source Template 2');
const targetTemplate = factory.template('Target Template');
const template = factory.template('Template');
const paragraphProperty = factory.property('rich_text', 'markdown');
const paragraphNumberProperty = factory.property('paragraph_number_property', 'numeric');

const sourceRelationshipType = {
  _id: new ObjectId(),
  name: 'Source Relationship Type',
  properties: [],
};

const targetRelationshipType = {
  _id: new ObjectId(),
  name: 'Target Relationship Type',
  properties: [],
};

const extractor: MongoPXExtractorDBO = {
  _id: factory.id('extractor'),
  sourceTemplateId: sourceTemplate._id,
  targetTemplateId: targetTemplate._id,
  paragraphNumberPropertyId: paragraphNumberProperty._id as ObjectId,
  paragraphPropertyId: paragraphProperty._id as ObjectId,
  sourceRelationshipTypeId: sourceRelationshipType._id,
  targetRelationshipTypeId: targetRelationshipType._id,
};

const extractor2: MongoPXExtractorDBO = {
  _id: factory.id('extractor2'),
  sourceTemplateId: sourceTemplate2._id,
  targetTemplateId: targetTemplate._id,
  paragraphNumberPropertyId: paragraphNumberProperty._id as ObjectId,
  paragraphPropertyId: paragraphProperty._id as ObjectId,
  sourceRelationshipTypeId: sourceRelationshipType._id,
  targetRelationshipTypeId: targetRelationshipType._id,
};

const entity = factory.entity('entity', sourceTemplate.name);
const entityPt = factory.entity('entity', sourceTemplate.name, {}, { language: 'pt' });

const entity2 = factory.entity('entity2', sourceTemplate.name);
const entityPt2 = factory.entity('entity2', sourceTemplate.name, {}, { language: 'pt' });

const entity3 = factory.entity('entity3', sourceTemplate2.name);
const entityPt3 = factory.entity('entity3', sourceTemplate2.name, {}, { language: 'pt' });

const extractionDBO: MongoPXEntityStatus = {
  _id: factory.id('extractionDBO'),
  entitySharedId: entity.sharedId!,
  extractorId: extractor._id,
  failedParagraphsCount: 0,
  paragraphsCount: 10,
  successfulParagraphsCount: 10,
  status: EntityStatus.Finished,
};

const entityThatDoesNotBelongToExtractor = factory.entity(
  'entityThatDoesNotBelongToExtractor',
  template.name
);

const createFixtures = (): DBFixture => ({
  relationtypes: [sourceRelationshipType, targetRelationshipType],
  [mongoPXEntitiesStatusCollection]: [extractionDBO],
  [mongoPXExtractorsCollection]: [extractor, extractor2],
  templates: [sourceTemplate, sourceTemplate2, targetTemplate],
  entities: [
    entity,
    entity2,
    entityPt,
    entityPt2,
    entity3,
    entityPt3,
    entityThatDoesNotBelongToExtractor,
  ],
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

  it('should return an list of extractors', async () => {
    const { extractorsQueryService } = setUpSut();

    const extractors = await extractorsQueryService.getExtractors().all();

    expect(extractors).toMatchObject([
      {
        _id: extractor._id.toString(),
        sourceTemplateId: sourceTemplate._id.toString(),
        targetTemplateId: targetTemplate._id.toString(),
        count: { generatedEntities: 2, new: 1 },
      },
      {
        _id: extractor2._id.toString(),
        sourceTemplateId: sourceTemplate2._id.toString(),
        targetTemplateId: targetTemplate._id.toString(),
        count: { generatedEntities: 1, new: 1 },
      },
    ]);
  });

  it('should count source Entities to be extracted which belongs to Extractor', async () => {
    const { extractorsQueryService } = setUpSut();

    const extractors = await extractorsQueryService.getExtractors().all();

    expect(extractors).toMatchObject([
      {
        _id: extractor._id.toString(),
        count: { generatedEntities: 2 },
      },
      {
        _id: extractor2._id.toString(),
        count: { generatedEntities: 1 },
      },
    ]);
  });

  it('should count source Entities that has never been extracted', async () => {
    const { extractorsQueryService } = setUpSut();

    const extractors = await extractorsQueryService.getExtractors().all();

    expect(extractors).toMatchObject([
      {
        _id: extractor._id.toString(),
        count: {
          new: 1,
        },
      },
      {
        _id: extractor2._id.toString(),
        count: { new: 1 },
      },
    ]);
  });
});
