import request from 'supertest';
import { Application } from 'express';

import { setUpApp } from 'api/utils/testingRoutes';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { tenants } from 'api/tenants';
import { PXCreateExtractorRequest, PXExtractRequest } from 'api/paragraphExtraction/types';
import { mongoPXExtractorsCollection } from 'api/paragraphExtraction/infrastructure/MongoPXExtractorsDataSource';
import { entityFixtures } from 'api/paragraphExtraction/application/specs/shared/extractorsQueryFixtures';
import { mongoPXEntitiesStatusCollection } from 'api/paragraphExtraction/infrastructure/MongoPXEntitiesStatusDataSource';
import { EntityStatus } from 'api/paragraphExtraction/domain/PXEntityStatusModel';
import { paragraphExtractionRoutes } from '../PXRoutes';

import {
  user,
  fixtures,
  templateFixtures,
  relationshipFixtures,
  paragraphProperty,
  paragraphNumberProperty,
} from './fixtures';

const checkFlagEnabledForRoute = async (app: Application, route: string) => {
  tenants.current().featureFlags!.paragraphExtraction = false;
  const response = await request(app).post(route);
  expect(response.statusCode).toBe(403);
  tenants.current().featureFlags!.paragraphExtraction = true;
};

const checkValidationForRoute = async (app: Application, route: string) => {
  const response = await request(app)
    .post(route)
    .send({ not_allowed_property: { key: 'value' } });

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
    it('should require the feature flag enabled', async () => {
      await checkFlagEnabledForRoute(app, '/api/paragraphExtraction/extractor');
    });

    it('should validate the input', async () => {
      await checkValidationForRoute(app, '/api/paragraphExtraction/extractor');
    });

    it('should create the extractor', async () => {
      const body: PXCreateExtractorRequest = {
        sourceTemplateId: templateFixtures.sourceTemplate._id.toString(),
        targetTemplateId: templateFixtures.targetTemplate._id.toString(),
        paragraphPropertyId: paragraphProperty._id!.toString(),
        paragraphNumberPropertyId: paragraphNumberProperty._id!.toString(),
        sourceRelationshipTypeId: relationshipFixtures.sourceRelationshipType._id.toString(),
        targetRelationshipTypeId: relationshipFixtures.targetRelationshipType._id.toString(),
      };
      const response = await request(app).post('/api/paragraphExtraction/extractor').send(body);
      const extractors = await testingEnvironment.db.getAllFrom(mongoPXExtractorsCollection);
      createdExtractorId = extractors?.[0]._id.toString() || '';

      expect(response.body.extractorId).toBe(createdExtractorId);
    });
  });

  describe('POST /api/paragraphExtraction/extract', () => {
    it('should require the feature flag enabled', async () => {
      await checkFlagEnabledForRoute(app, '/api/paragraphExtraction/extract');
    });

    it('should validate the input', async () => {
      await checkValidationForRoute(app, '/api/paragraphExtraction/extract');
    });

    it('should trigger the extraction', async () => {
      const entity1 = entityFixtures.entity1En;
      const entity2 = entityFixtures.entity2En;

      const body: PXExtractRequest = {
        extractorId: createdExtractorId,
        entitySharedIds: [entity1.sharedId!],
      };
      await request(app).post('/api/paragraphExtraction/extract').send(body);
      const extractorStatuses = await testingEnvironment.db.getAllFrom(
        mongoPXEntitiesStatusCollection
      );

      const entity1Status = extractorStatuses?.find(s => s.entitySharedId === entity1.sharedId);
      const entity2Status = extractorStatuses?.find(s => s.entitySharedId === entity2.sharedId);

      expect(entity1Status?.status).toBe(EntityStatus.Processing);
      expect(entity2Status?.status).toBe(EntityStatus.New);
    });
  });
});
