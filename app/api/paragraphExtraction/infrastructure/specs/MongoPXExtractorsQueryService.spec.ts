import { ObjectId } from 'mongodb';

import { testingEnvironment } from 'api/utils/testingEnvironment';
import { DBFixture } from 'api/utils/testing_db';
import { MongoPXExtractorDBO } from 'api/paragraphExtraction/infrastructure/MongoPXExtractorDBO';
import { mongoPXExtractorsCollection } from 'api/paragraphExtraction/infrastructure/MongoPXExtractorsDataSource';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { EntityStatus } from 'api/paragraphExtraction/domain/PXEntityStatusModel';

import { LanguageISO6391 } from 'shared/types/commonTypes';
import { MongoPXExtractorsQueryService } from '../MongoPXExtractorsQueryService';
import { mongoPXEntitiesStatusCollection } from '../MongoPXEntitiesStatusDataSource';
import { MongoPXEntityStatusDBO } from '../MongoPXEntityStatusDBO';

const f = getFixturesFactory();
const sourceTemplate1 = f.template('Source Template');
const sourceTemplate2 = f.template('Source Template 2');
const sourceTemplate3 = f.template('Source Template 3');
const targetTemplate1 = f.template('Target Template');
const templateWithoutExtractor = f.template('Template');
const paragraphProperty = f.property('rich_text', 'markdown');
const paragraphNumberProperty = f.property('paragraph_number_property', 'numeric');

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

const extractor1: MongoPXExtractorDBO = {
  _id: f.id('extractor'),
  sourceTemplateId: sourceTemplate1._id,
  targetTemplateId: targetTemplate1._id,
  paragraphNumberPropertyId: paragraphNumberProperty._id as ObjectId,
  paragraphPropertyId: paragraphProperty._id as ObjectId,
  sourceRelationshipTypeId: sourceRelationshipType._id,
  targetRelationshipTypeId: targetRelationshipType._id,
};

const extractor2: MongoPXExtractorDBO = {
  _id: f.id('extractor2'),
  sourceTemplateId: sourceTemplate2._id,
  targetTemplateId: targetTemplate1._id,
  paragraphNumberPropertyId: paragraphNumberProperty._id as ObjectId,
  paragraphPropertyId: paragraphProperty._id as ObjectId,
  sourceRelationshipTypeId: sourceRelationshipType._id,
  targetRelationshipTypeId: targetRelationshipType._id,
};

const extractorWithoutEntities: MongoPXExtractorDBO = {
  _id: f.id('extractor3'),
  sourceTemplateId: sourceTemplate3._id,
  targetTemplateId: targetTemplate1._id,
  paragraphNumberPropertyId: paragraphNumberProperty._id as ObjectId,
  paragraphPropertyId: paragraphProperty._id as ObjectId,
  sourceRelationshipTypeId: sourceRelationshipType._id,
  targetRelationshipTypeId: targetRelationshipType._id,
};

const lang = ['en', 'pt'];

const [entity1En, entity1Pt] = f.entityInMultipleLanguages(lang, 'entity1', sourceTemplate1.name);
const [entity2En, entity2Pt] = f.entityInMultipleLanguages(lang, 'entity2', sourceTemplate1.name);
const [entity3En, entity3Pt] = f.entityInMultipleLanguages(lang, 'entity3', sourceTemplate2.name);
const [entity4En, entity4Pt] = f.entityInMultipleLanguages(lang, 'entity4', sourceTemplate1.name);
const [entity5En, entity5Pt] = f.entityInMultipleLanguages(lang, 'entity5', sourceTemplate1.name);
const [entity6En, entity6Pt] = f.entityInMultipleLanguages(lang, 'entity6', sourceTemplate1.name);
const [entity7En, entity7Pt] = f.entityInMultipleLanguages(lang, 'entity7', sourceTemplate1.name);
const [entity8En, entity8Pt] = f.entityInMultipleLanguages(lang, 'entity8', sourceTemplate1.name);
const [entity9En, entity9Pt] = f.entityInMultipleLanguages(lang, 'entity9', sourceTemplate1.name);
const [entityWithoutExtractorEn] = f.entityInMultipleLanguages(
  lang,
  'entityWithoutExtractor',
  templateWithoutExtractor.name
);

const pxEntityStatus1: MongoPXEntityStatusDBO = {
  _id: f.id('pxEntityStatus1'),
  entitySharedId: entity1En.sharedId!,
  extractorId: extractor1._id,
  status: EntityStatus.Processed,
};

const pxEntityStatus2: MongoPXEntityStatusDBO = {
  _id: f.id('pxEntityStatus2'),
  entitySharedId: entity2En.sharedId!,
  extractorId: extractor1._id,
  status: EntityStatus.New,
};

const pxEntityStatus3: MongoPXEntityStatusDBO = {
  _id: f.id('pxEntityStatus3'),
  entitySharedId: entity3En.sharedId!,
  extractorId: extractor2._id,
  status: EntityStatus.New,
};

const pxEntityStatus4: MongoPXEntityStatusDBO = {
  _id: f.id('pxEntityStatus4'),
  entitySharedId: entity4En.sharedId!,
  extractorId: extractor1._id,
  status: EntityStatus.New,
};

const pxEntityStatus5: MongoPXEntityStatusDBO = {
  _id: f.id('pxEntityStatus5'),
  entitySharedId: entity5En.sharedId!,
  extractorId: extractor1._id,
  status: EntityStatus.Processing,
};

const pxEntityStatus6: MongoPXEntityStatusDBO = {
  _id: f.id('pxEntityStatus6'),
  entitySharedId: entity6En.sharedId!,
  extractorId: extractor1._id,
  status: EntityStatus.Obsolete,
};

const pxEntityStatus7: MongoPXEntityStatusDBO = {
  _id: f.id('pxEntityStatus7'),
  entitySharedId: entity7En.sharedId!,
  extractorId: extractor1._id,
  status: EntityStatus.Obsolete,
};

const pxEntityStatus8: MongoPXEntityStatusDBO = {
  _id: f.id('pxEntityStatus8'),
  entitySharedId: entity8En.sharedId!,
  extractorId: extractor1._id,
  status: EntityStatus.Error,
};

const pxEntityStatus9: MongoPXEntityStatusDBO = {
  _id: f.id('pxEntityStatus9'),
  entitySharedId: entity9En.sharedId!,
  extractorId: extractor1._id,
  status: EntityStatus.New,
};

const entityFixtures = {
  entity1En,
  entity1Pt,
  entity2En,
  entity2Pt,
  entity3En,
  entity3Pt,
  entity4En,
  entity4Pt,
  entity5En,
  entity5Pt,
  entity6En,
  entity6Pt,
  entity7En,
  entity7Pt,
  entity8En,
  entity8Pt,
  entity9En,
  entity9Pt,
  entityWithoutExtractorEn,
};

const entityStatusFixtures = {
  pxEntityStatus1,
  pxEntityStatus2,
  pxEntityStatus3,
  pxEntityStatus4,
  pxEntityStatus5,
  pxEntityStatus6,
  pxEntityStatus7,
  pxEntityStatus8,
  pxEntityStatus9,
};

const fixtures = {
  relationtypes: [sourceRelationshipType, targetRelationshipType],
  [mongoPXExtractorsCollection]: [extractor1, extractor2, extractorWithoutEntities],
  [mongoPXEntitiesStatusCollection]: Object.values(entityStatusFixtures).map(value => value),
  templates: [sourceTemplate1, sourceTemplate2, targetTemplate1],
  entities: Object.values(entityFixtures).map(value => value),
  settings: [
    {
      languages: [
        { label: 'English', key: 'en' as LanguageISO6391, default: true },
        { label: 'Portuguese', key: 'pt' as LanguageISO6391 },
      ],
    },
  ],
};

const createFixtures = (): DBFixture => fixtures;

const setUpSut = () => {
  const db = getConnection();
  const transaction = DefaultTransactionManager();

  const extractorsQueryService = new MongoPXExtractorsQueryService(db, transaction);

  return {
    extractorsQueryService,
  };
};

describe('MongoPXExtractorsQueryService', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(createFixtures());
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('getExtractors', () => {
    it('should return a list of extractors with status count per state', async () => {
      const { extractorsQueryService } = setUpSut();

      const extractors = await extractorsQueryService.getExtractors().all();

      expect(extractors).toMatchObject([
        {
          _id: extractor1._id.toString(),
          sourceTemplateId: sourceTemplate1._id.toString(),
          targetTemplateId: targetTemplate1._id.toString(),
          statusCount: { new: 3, processing: 1, obsolete: 2, error: 1, processed: 1, total: 8 },
        },
        {
          _id: extractor2._id.toString(),
          sourceTemplateId: sourceTemplate2._id.toString(),
          targetTemplateId: targetTemplate1._id.toString(),
          statusCount: { new: 1, processing: 0, obsolete: 0, error: 0, processed: 0, total: 1 },
        },
        {
          _id: extractorWithoutEntities._id.toString(),
          sourceTemplateId: sourceTemplate3._id.toString(),
          targetTemplateId: targetTemplate1._id.toString(),
          statusCount: { new: 0, processing: 0, obsolete: 0, error: 0, processed: 0, total: 0 },
        },
      ]);
    });
  });

  describe('getExtractorStatuses', () => {
    const expectedRow = (entityNumber: number, status: EntityStatus) => ({
      entity: {
        _id: entityFixtures[
          `entity${entityNumber}Pt` as keyof typeof entityFixtures
        ]._id?.toString(),
        language: 'pt',
        sharedId: `entity${entityNumber}`,
        title: `entity${entityNumber}`,
      },
      status: {
        _id: entityStatusFixtures[
          `pxEntityStatus${entityNumber}` as keyof typeof entityStatusFixtures
        ]._id.toString(),
        status,
      },
    });

    it('should return a list of extraction statuses for the requested extractor with default pagination', async () => {
      const { extractorsQueryService } = setUpSut();

      const extractorStatuses = await extractorsQueryService
        .getExtractorStatuses({ id: extractor1._id.toString(), language: 'pt' })
        .all();

      expect(extractorStatuses).toMatchObject([
        {
          rows: [
            expectedRow(1, EntityStatus.Processed),
            expectedRow(2, EntityStatus.New),
            expectedRow(4, EntityStatus.New),
            expectedRow(5, EntityStatus.Processing),
            expectedRow(6, EntityStatus.Obsolete),
            expectedRow(7, EntityStatus.Obsolete),
            expectedRow(8, EntityStatus.Error),
            expectedRow(9, EntityStatus.New),
          ],
          page: { number: 1, size: 10 },
          totalRows: 8,
        },
      ]);
    });

    it('should return a paginated list of extraction statuses', async () => {
      const { extractorsQueryService } = setUpSut();

      const extractorStatuses = await extractorsQueryService
        .getExtractorStatuses({
          id: extractor1._id.toString(),
          language: 'pt',
          page: { number: 2, size: 3 },
        })
        .all();

      expect(extractorStatuses).toMatchObject([
        {
          rows: [
            expectedRow(5, EntityStatus.Processing),
            expectedRow(6, EntityStatus.Obsolete),
            expectedRow(7, EntityStatus.Obsolete),
          ],
          page: { number: 2, size: 3 },
          totalRows: 8,
        },
      ]);
    });

    it('should return a filtered list of extraction statuses', async () => {
      const { extractorsQueryService } = setUpSut();

      const extractorStatuses = await extractorsQueryService
        .getExtractorStatuses({
          id: extractor1._id.toString(),
          language: 'pt',
          filter: { status: [EntityStatus.New, EntityStatus.Error] },
        })
        .all();

      expect(extractorStatuses).toMatchObject([
        {
          rows: [
            expectedRow(2, EntityStatus.New),
            expectedRow(4, EntityStatus.New),
            expectedRow(8, EntityStatus.Error),
            expectedRow(9, EntityStatus.New),
          ],
          page: { number: 1, size: 10 },
          totalRows: 4,
        },
      ]);
    });
  });
});
