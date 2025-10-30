/* eslint-disable max-statements */
import { ObjectId } from 'mongodb';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { DBFixture } from 'api/utils/testing_db';
import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { EntityStatus } from 'api/paragraphExtraction/domain/PXEntityStatusModel';

import {
  extractorsQueryFixtures,
  entityFixtures,
  entityStatusFixtures,
  extractor1,
  extractor2,
  extractorWithoutEntities,
  sourceTemplate1,
  sourceTemplate2,
  sourceTemplate3,
  targetTemplate1,
  relationshipFixtures,
  paragraphNumberProperty,
  paragraphProperty,
  pxEntityStatus10,
  entity10En,
  entity10Pt,
} from '../../application/specs/shared/extractorsQueryFixtures';

import { MongoPXExtractorsQueryService } from '../MongoPXExtractorsQueryService';
import { mongoPXEntitiesStatusCollection } from '../MongoPXEntitiesStatusDataSource';
import { mongoPXExtractorsCollection } from '../MongoPXExtractorsDataSource';

const createFixtures = (): DBFixture => extractorsQueryFixtures;

const setUpSut = () => {
  const db = getConnection();
  const transaction = TransactionManagerFactory.default();

  const extractorsQueryService = new MongoPXExtractorsQueryService(db, transaction);

  return { extractorsQueryService };
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
          paragraphNumberPropertyId: paragraphNumberProperty._id?.toString(),
          paragraphPropertyId: paragraphProperty._id?.toString(),
          statusCount: { new: 3, processing: 1, obsolete: 2, error: 1, processed: 1, total: 8 },
        },
        {
          _id: extractor2._id.toString(),
          sourceTemplateId: sourceTemplate2._id.toString(),
          targetTemplateId: targetTemplate1._id.toString(),
          paragraphNumberPropertyId: paragraphNumberProperty._id?.toString(),
          paragraphPropertyId: paragraphProperty._id?.toString(),
          statusCount: { new: 1, processing: 0, obsolete: 0, error: 0, processed: 0, total: 1 },
        },
        {
          _id: extractorWithoutEntities._id.toString(),
          sourceTemplateId: sourceTemplate3._id.toString(),
          targetTemplateId: targetTemplate1._id.toString(),
          paragraphNumberPropertyId: paragraphNumberProperty._id?.toString(),
          paragraphPropertyId: paragraphProperty._id?.toString(),
          statusCount: { new: 0, processing: 0, obsolete: 0, error: 0, processed: 0, total: 0 },
        },
      ]);
    });

    it('should count processing_obsolete status as processing', async () => {
      await testingEnvironment.setFixtures({
        ...createFixtures(),
        [mongoPXExtractorsCollection]: [extractor1],
        [mongoPXEntitiesStatusCollection]: [entityStatusFixtures.pxEntityStatus5, pxEntityStatus10],
      });

      const { extractorsQueryService } = setUpSut();

      const extractors = await extractorsQueryService.getExtractors().all();

      expect(extractors).toMatchObject([
        {
          _id: extractor1._id.toString(),
          sourceTemplateId: sourceTemplate1._id.toString(),
          targetTemplateId: targetTemplate1._id.toString(),
          paragraphNumberPropertyId: paragraphNumberProperty._id?.toString(),
          paragraphPropertyId: paragraphProperty._id?.toString(),
          statusCount: { new: 0, processing: 2, obsolete: 0, error: 0, processed: 0, total: 2 },
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

    it('should map processing_obsolete output to processing', async () => {
      await testingEnvironment.setFixtures({
        ...createFixtures(),
        entities: [entityFixtures.entity9En, entityFixtures.entity9Pt, entity10En, entity10Pt],
        [mongoPXEntitiesStatusCollection]: [entityStatusFixtures.pxEntityStatus9, pxEntityStatus10],
      });
      const { extractorsQueryService } = setUpSut();

      const extractorStatuses = await extractorsQueryService
        .getExtractorStatuses({
          id: extractor1._id.toString(),
          language: 'pt',
          page: { number: 1, size: 2 },
        })
        .all();

      expect(extractorStatuses).toMatchObject([
        {
          rows: [
            {
              entity: {
                _id: entity10Pt._id?.toString(),
                language: entity10Pt.language,
                sharedId: entity10Pt.sharedId,
                title: entity10Pt.sharedId,
              },
              status: {
                _id: pxEntityStatus10._id.toString(),
                status: EntityStatus.Processing,
              },
            },
            expectedRow(9, EntityStatus.New),
          ],
          page: { number: 1, size: 2 },
          totalRows: 2,
        },
      ]);
    });

    it('should also include processing_obsolete if filter has processing', async () => {
      await testingEnvironment.setFixtures({
        ...createFixtures(),
        entities: [entityFixtures.entity7En, entityFixtures.entity5Pt, entity10En, entity10Pt],
        [mongoPXEntitiesStatusCollection]: [entityStatusFixtures.pxEntityStatus5, pxEntityStatus10],
      });
      const { extractorsQueryService } = setUpSut();

      const extractorStatuses = await extractorsQueryService
        .getExtractorStatuses({
          id: extractor1._id.toString(),
          language: 'pt',
          page: { number: 1, size: 2 },
          filter: { status: [EntityStatus.Processing] },
        })
        .all();

      expect(extractorStatuses).toMatchObject([
        {
          rows: [
            {
              entity: {
                _id: entity10Pt._id?.toString(),
                language: entity10Pt.language,
                sharedId: entity10Pt.sharedId,
                title: entity10Pt.sharedId,
              },
              status: {
                _id: pxEntityStatus10._id.toString(),
                status: EntityStatus.Processing,
              },
            },
            expectedRow(5, EntityStatus.Processing),
          ],
          page: { number: 1, size: 2 },
          totalRows: 2,
        },
      ]);
    });
  });

  describe('getEntityParagraphRelationships', () => {
    const mappedRelationship = (relationship: {
      _id: ObjectId;
      entity: string | undefined;
      hub: ObjectId;
      template: ObjectId;
    }) => ({
      id: relationship._id.toString(),
      hubId: relationship.hub.toString(),
      entitySharedId: relationship.entity,
      relationshipTypeId: relationship.template.toString(),
    });

    it('should return a list of relationships for the particular entity that match the extractor parameters', async () => {
      const { extractorsQueryService } = setUpSut();

      const entity1Paragraphs = await extractorsQueryService
        .getEntityParagraphRelationships({
          id: entityFixtures.entity1En.sharedId!,
          extractorId: extractor1._id.toString(),
        })
        .all();

      expect(entity1Paragraphs).toMatchObject([
        mappedRelationship(relationshipFixtures.relationshipP1Hub1),
        mappedRelationship(relationshipFixtures.relationshipP2Hub1),
        mappedRelationship(relationshipFixtures.relationshipP3Hub2),
      ]);

      const entity5Paragraphs = await extractorsQueryService
        .getEntityParagraphRelationships({
          id: entityFixtures.entity5En.sharedId!,
          extractorId: extractor1._id.toString(),
        })
        .all();

      expect(entity5Paragraphs).toMatchObject([
        mappedRelationship(relationshipFixtures.relationshipP1Hub3),
      ]);
    });

    it('should not include relationships if the entityStatus is missing, by default', async () => {
      const temporaryFixtures = createFixtures();
      const fixturesWithoutStatuses = {
        ...temporaryFixtures,
        [mongoPXEntitiesStatusCollection]: [],
      };
      await testingEnvironment.setUp(fixturesWithoutStatuses);

      const { extractorsQueryService } = setUpSut();

      const entity1Paragraphs = await extractorsQueryService
        .getEntityParagraphRelationships({
          id: entityFixtures.entity1En.sharedId!,
          extractorId: extractor1._id.toString(),
        })
        .all();

      expect(entity1Paragraphs).toMatchObject([]);
    });

    it('should include relationships if the entityStatus is missing if required (certain flows require this, like extractor creation)', async () => {
      const temporaryFixtures = createFixtures();
      const fixturesWithoutStatuses = {
        ...temporaryFixtures,
        [mongoPXEntitiesStatusCollection]: [],
      };
      await testingEnvironment.setUp(fixturesWithoutStatuses);

      const { extractorsQueryService } = setUpSut();

      const entity1Paragraphs = await extractorsQueryService
        .getEntityParagraphRelationships({
          id: entityFixtures.entity1En.sharedId!,
          extractorId: extractor1._id.toString(),
          options: { requireEntityStatus: false },
        })
        .all();

      expect(entity1Paragraphs).toMatchObject([
        mappedRelationship(relationshipFixtures.relationshipP1Hub1),
        mappedRelationship(relationshipFixtures.relationshipP2Hub1),
        mappedRelationship(relationshipFixtures.relationshipP3Hub2),
      ]);
    });
  });

  describe('getExtractedParagraphs', () => {
    it('should return paragraphs, correctly paginated, grouped by sharedId and ordered by paragraph number and main language', async () => {
      const { extractorsQueryService } = setUpSut();

      const entity1ParagraphsPg1 = await extractorsQueryService
        .getExtractedParagraphs({
          ids: [
            entityFixtures.paragraph1Entity1En.sharedId!,
            entityFixtures.paragraph1Entity1Pt.sharedId!,
            entityFixtures.paragraph2Entity1En.sharedId!,
            entityFixtures.paragraph2Entity1Pt.sharedId!,
            entityFixtures.paragraph3Entity1En.sharedId!,
            entityFixtures.paragraph3Entity1Pt.sharedId!,
          ],
          paragraphNumberProperty: paragraphNumberProperty.name,
          mainLanguage: 'pt',
          page: { number: 1, size: 2 },
        })
        .first();

      expect(entity1ParagraphsPg1?.totalRows).toBe(3);
      expect(entity1ParagraphsPg1?.page).toMatchObject({ number: 1, size: 2 });
      expect(entity1ParagraphsPg1?.rows[0]).toMatchObject({
        sharedId: entityFixtures.paragraph2Entity1En.sharedId,
        entities: [
          { _id: entityFixtures.paragraph2Entity1Pt._id },
          { _id: entityFixtures.paragraph2Entity1En._id },
        ],
      });
      expect(entity1ParagraphsPg1?.rows[1]).toMatchObject({
        sharedId: entityFixtures.paragraph1Entity1En.sharedId,
        entities: [
          { _id: entityFixtures.paragraph1Entity1Pt._id },
          { _id: entityFixtures.paragraph1Entity1En._id },
        ],
      });

      const entity1ParagraphsPg2 = await extractorsQueryService
        .getExtractedParagraphs({
          ids: [
            entityFixtures.paragraph1Entity1En.sharedId!,
            entityFixtures.paragraph1Entity1Pt.sharedId!,
            entityFixtures.paragraph2Entity1En.sharedId!,
            entityFixtures.paragraph2Entity1Pt.sharedId!,
            entityFixtures.paragraph3Entity1En.sharedId!,
            entityFixtures.paragraph3Entity1Pt.sharedId!,
          ],
          paragraphNumberProperty: paragraphNumberProperty.name,
          mainLanguage: 'pt',
          page: { number: 2, size: 2 },
        })
        .first();

      expect(entity1ParagraphsPg2?.totalRows).toBe(3);
      expect(entity1ParagraphsPg2?.page).toMatchObject({ number: 2, size: 2 });
      expect(entity1ParagraphsPg2?.rows[0]).toMatchObject({
        sharedId: entityFixtures.paragraph3Entity1En.sharedId,
        entities: [
          { _id: entityFixtures.paragraph3Entity1Pt._id },
          { _id: entityFixtures.paragraph3Entity1En._id },
        ],
      });

      const entity5Paragraphs = await extractorsQueryService
        .getExtractedParagraphs({
          ids: [
            entityFixtures.paragraph1Entity5En.sharedId!,
            entityFixtures.paragraph1Entity5Pt.sharedId!,
          ],
          paragraphNumberProperty: paragraphNumberProperty.name,
          mainLanguage: 'en',
        })
        .first();

      expect(entity5Paragraphs?.totalRows).toBe(1);
      expect(entity5Paragraphs?.page).toMatchObject({ number: 1, size: 10 });
      expect(entity5Paragraphs?.rows[0]).toMatchObject({
        sharedId: entityFixtures.paragraph1Entity5En.sharedId,
        entities: [
          { _id: entityFixtures.paragraph1Entity5En._id },
          { _id: entityFixtures.paragraph1Entity5Pt._id },
        ],
      });
    });
  });
});
