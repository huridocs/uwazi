/* eslint-disable max-statements */
import request from 'supertest';
import { Application } from 'express';
import { ObjectId } from 'mongodb';
import { CreateParagraphExtractionEntityStatusesJob } from 'api/paragraphExtraction/jobs/CreateParagraphExtractionEntityStatusesJob';
import { setUpApp } from 'api/utils/testingRoutes';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { tenants } from 'api/tenants';
import {
  EntityStatusDTO,
  PXCreateExtractorRequest,
  PXDeleteExtractorRequest,
  PXExtractNewRequest,
  PXExtractRequest,
  PXGetEntityParagraphsRequest,
  PXGetExtractorStatusesRequest,
} from 'api/paragraphExtraction/types';
import { mongoPXExtractorsCollection } from 'api/paragraphExtraction/infrastructure/MongoPXExtractorsDataSource';
import { mongoPXEntitiesStatusCollection } from 'api/paragraphExtraction/infrastructure/MongoPXEntitiesStatusDataSource';
import { paragraphExtractionRoutes } from '../PXRoutes';

import {
  user,
  fixtures,
  templateFixtures,
  entityFixtures,
  relationshipTypesFixtures,
  paragraphProperty,
  paragraphNumberProperty,
} from './fixtures';

const mockDispatchMethod = jest.fn();

// Mock DefaultDispatcher from the factories module
jest.mock('api/core/libs/queue/configuration/factories', () => ({
  ...jest.requireActual('api/core/libs/queue/configuration/factories'), // Preserve other exports
  DefaultDispatcher: jest.fn().mockResolvedValue({
    // Mock DefaultDispatcher export
    // Use a getter to access mockDispatchMethod lazily, resolving the ReferenceError
    get dispatch() {
      return mockDispatchMethod;
    },
  }),
}));

// Simplify AppContext mock as it's not primarily responsible for JobsDispatcher in this flow
jest.mock('../../../utils/AppContext.ts', () => {
  const originalModule = jest.requireActual('../../../utils/AppContext.ts');
  return {
    __esModule: true,
    appContext: originalModule.appContext,
  };
});

const checkFlagEnabledForRoute = async (
  app: Application,
  method: 'get' | 'post' | 'delete',
  route: string
) => {
  tenants.current().featureFlags!.paragraphExtraction = false;
  const response = await request(app)[method](route);
  expect(response.statusCode).toBe(403);
  tenants.current().featureFlags!.paragraphExtraction = true;
};

const checkValidationForRoute = async (
  app: Application,
  method: 'get' | 'post' | 'delete',
  route: string
) => {
  const req = request(app)[method](route);
  if (method === 'post') {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    req.send({ not_allowed_property: { key: 'value' } });
  }

  const response = await req;

  expect(response.statusCode).toBe(422);
  expect(response.body.error).toContain('validation failed');
};

describe('PX Routes (Paragraph extraction flow, tests must be run in sequence)', () => {
  const app: Application = setUpApp(paragraphExtractionRoutes, (req, _res, next) => {
    (req as any).user = user;
    next();
  });

  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => testingEnvironment.tearDown());

  let createdExtractorId = '';

  describe('POST /api/paragraphExtraction/extractor', () => {
    beforeEach(() => {
      mockDispatchMethod.mockReset();
    });

    // Helper function to simulate the creation of entity statuses by the job
    const simulateJobCreationOfEntityStatuses = async (jobParams: {
      extractorId: string;
      sourceTemplateId: string;
    }) => {
      const { extractorId, sourceTemplateId: reqSourceTemplateId } = jobParams;
      const sourceTemplateObjectIdFromString = ObjectId.createFromHexString(reqSourceTemplateId);

      const entitiesToConsider = [entityFixtures.entity1En, entityFixtures.entity2En];

      const relevantEntities = entitiesToConsider.filter(
        e =>
          e.template &&
          ObjectId.createFromHexString(e.template.toString()).equals(
            sourceTemplateObjectIdFromString
          )
      );

      const statusesToInsert = relevantEntities.map(entity => ({
        _id: new ObjectId(),
        extractorId: ObjectId.createFromHexString(extractorId),
        entitySharedId: entity.sharedId!,
        status: EntityStatusDTO.New,
      }));

      if (statusesToInsert.length > 0) {
        const collection = testingEnvironment.db.getCollection(mongoPXEntitiesStatusCollection);
        if (collection) {
          await collection.insertMany(statusesToInsert);
        }
      }
    };

    it('should require the feature flag enabled', async () => {
      await checkFlagEnabledForRoute(app, 'post', '/api/paragraphExtraction/extractor');
    });

    it('should validate the input', async () => {
      await checkValidationForRoute(app, 'post', '/api/paragraphExtraction/extractor');
    });

    it('should create the extractor and dispatch a job to create entity statuses', async () => {
      mockDispatchMethod.mockImplementationOnce(async (jobConstructor, jobParams) => {
        if (jobConstructor === CreateParagraphExtractionEntityStatusesJob) {
          await simulateJobCreationOfEntityStatuses(jobParams);
        }
        return Promise.resolve();
      });

      const body: PXCreateExtractorRequest = {
        sourceTemplateId: templateFixtures.sourceTemplate._id.toString(),
        targetTemplateId: templateFixtures.targetTemplate._id.toString(),
        paragraphPropertyId: paragraphProperty._id!.toString(),
        paragraphNumberPropertyId: paragraphNumberProperty._id!.toString(),
        sourceRelationshipTypeId: relationshipTypesFixtures.sourceRelationshipType._id.toString(),
        targetRelationshipTypeId: relationshipTypesFixtures.targetRelationshipType._id.toString(),
      };
      const response = await request(app).post('/api/paragraphExtraction/extractor').send(body);
      const extractors = await testingEnvironment.db.getAllFrom(mongoPXExtractorsCollection);
      createdExtractorId = extractors?.[0]._id.toString() || '';

      expect(response.body.extractorId).toBe(createdExtractorId);
      expect(mockDispatchMethod).toHaveBeenCalledWith(
        CreateParagraphExtractionEntityStatusesJob,
        expect.objectContaining({
          extractorId: createdExtractorId,
          sourceTemplateId: templateFixtures.sourceTemplate._id.toString(),
        })
      );
    });
  });

  describe('POST /api/paragraphExtraction/extract', () => {
    it('should require the feature flag enabled', async () => {
      await checkFlagEnabledForRoute(app, 'post', '/api/paragraphExtraction/extract');
    });

    it('should validate the input', async () => {
      await checkValidationForRoute(app, 'post', '/api/paragraphExtraction/extract');
    });

    it('should trigger the extraction', async () => {
      const entity1 = entityFixtures.entity1En;
      const entity2 = entityFixtures.entity2En;

      const body: PXExtractRequest = {
        extractorId: createdExtractorId,
        entitySharedIds: [entity1.sharedId!],
      };

      await request(app).post('/api/paragraphExtraction/extract').send(body);

      const statuses = await testingEnvironment.db.getAllFrom(mongoPXEntitiesStatusCollection);
      const entity1Status = statuses?.find(s => s.entitySharedId === entity1.sharedId);
      const entity2Status = statuses?.find(s => s.entitySharedId === entity2.sharedId);

      expect(entity1Status?.status).toBe(EntityStatusDTO.Processing);
      expect(entity2Status?.status).toBe(EntityStatusDTO.New);
    });
  });

  describe('POST /api/paragraphExtraction/extractNew', () => {
    it('should require the feature flag enabled', async () => {
      await checkFlagEnabledForRoute(app, 'post', '/api/paragraphExtraction/extractNew');
    });

    it('should validate the input', async () => {
      await checkValidationForRoute(app, 'post', '/api/paragraphExtraction/extractNew');
    });

    it('should trigger the extraction of entities in "new"', async () => {
      const entity2 = entityFixtures.entity2En;

      const body: PXExtractNewRequest = { extractorId: createdExtractorId };

      await request(app).post('/api/paragraphExtraction/extractNew').send(body);

      const statuses = await testingEnvironment.db.getAllFrom(mongoPXEntitiesStatusCollection);
      const entity2Status = statuses?.find(s => s.entitySharedId === entity2.sharedId);

      expect(entity2Status?.status).toBe(EntityStatusDTO.Processing);
    });
  });

  describe('GET /api/paragraphExtraction/extractors', () => {
    it('should require the feature flag enabled', async () => {
      await checkFlagEnabledForRoute(app, 'get', '/api/paragraphExtraction/extractors');
    });

    it('should get the extractors', async () => {
      const response = await request(app).get('/api/paragraphExtraction/extractors');

      expect(response.body[0]._id.toString()).toBe(createdExtractorId);
      expect(response.body[0].statusCount).toMatchObject({
        [EntityStatusDTO.Processing]: 2,
        total: 2,
      });
    });
  });

  describe('GET /api/paragraphExtraction/extractorStatuses', () => {
    it('should require the feature flag enabled', async () => {
      await checkFlagEnabledForRoute(app, 'get', '/api/paragraphExtraction/extractorStatuses');
    });

    it('should validate the input', async () => {
      await checkValidationForRoute(app, 'get', '/api/paragraphExtraction/extractorStatuses');
    });

    it('should get the extractor statuses', async () => {
      const query: PXGetExtractorStatusesRequest = {
        id: createdExtractorId,
        page: { number: 1, size: 2 },
        filter: { status: [EntityStatusDTO.Processing, EntityStatusDTO.New] },
      };
      const response = await request(app)
        .get('/api/paragraphExtraction/extractorStatuses')
        .set('content-language', 'pt')
        .query(query);

      expect(response.body).toMatchObject({
        totalRows: 2,
        page: { number: 1, size: 2 },
        rows: [
          {
            availableFileLanguages: ['en', 'pt'],
            entity: { sharedId: entityFixtures.entity1En.sharedId, language: 'pt' },
            paragraphsCount: 2,
            status: { status: EntityStatusDTO.Processing },
          },
          {
            availableFileLanguages: ['en'],
            entity: { sharedId: entityFixtures.entity2En.sharedId },
            paragraphsCount: 0,
            status: { status: EntityStatusDTO.Processing },
          },
        ],
      });
      const responseSharedIds = response.body.rows.map((r: any) => r.entity.sharedId);
      expect(responseSharedIds).toContain(entityFixtures.entity1En.sharedId);
      expect(responseSharedIds).toContain(entityFixtures.entity2En.sharedId);
      expect(responseSharedIds.length).toBe(2);
    });
  });

  describe('GET /api/paragraphExtraction/entityParagraphs', () => {
    it('should require the feature flag enabled', async () => {
      await checkFlagEnabledForRoute(app, 'get', '/api/paragraphExtraction/entityParagraphs');
    });

    it('should validate the input', async () => {
      await checkValidationForRoute(app, 'get', '/api/paragraphExtraction/entityParagraphs');
    });

    it('should get the entity paragraphs', async () => {
      const query: PXGetEntityParagraphsRequest = {
        id: entityFixtures.entity1En.sharedId!,
        extractorId: createdExtractorId,
        page: { number: 1, size: 3 },
      };
      const response = await request(app)
        .get('/api/paragraphExtraction/entityParagraphs')
        .query(query);

      expect(response.body).toMatchObject({
        totalRows: 2,
        page: { number: 1, size: 3 },
        rows: [
          {
            sharedId: entityFixtures.paragraph2En.sharedId,
            entities: [
              { _id: entityFixtures.paragraph2En._id?.toString() },
              { _id: entityFixtures.paragraph2Pt._id?.toString() },
            ],
          },
          {
            sharedId: entityFixtures.paragraph1En.sharedId,
            entities: [
              { _id: entityFixtures.paragraph1En._id?.toString() },
              { _id: entityFixtures.paragraph1Pt._id?.toString() },
            ],
          },
        ],
      });
    });
  });

  describe('DELETE /api/paragraphExtraction/extractor', () => {
    it('should require the feature flag enabled', async () => {
      await checkFlagEnabledForRoute(app, 'delete', '/api/paragraphExtraction/extractor');
    });

    it('should validate the input', async () => {
      await checkValidationForRoute(app, 'delete', '/api/paragraphExtraction/extractor');
    });

    it('should delete the extractor', async () => {
      const query: PXDeleteExtractorRequest = {
        id: createdExtractorId,
      };
      const response = await request(app).delete('/api/paragraphExtraction/extractor').query(query);
      const extractors = await testingEnvironment.db.getAllFrom(mongoPXExtractorsCollection);

      expect(response.body).toMatchObject({ success: true });
      expect(extractors?.length).toBe(0);
    });
  });
});
