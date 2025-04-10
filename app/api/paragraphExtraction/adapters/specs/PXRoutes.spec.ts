import request from 'supertest';
import { Application } from 'express';

import { setUpApp } from 'api/utils/testingRoutes';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { tenants } from 'api/tenants';
import { PXCreateExtractorRequest } from 'api/paragraphExtraction/types';
import { mongoPXExtractorsCollection } from 'api/paragraphExtraction/infrastructure/MongoPXExtractorsDataSource';
import { paragraphExtractionRoutes } from '../PXRoutes';

import {
  fixtures,
  templateFixtures,
  relationshipFixtures,
  paragraphProperty,
  paragraphNumberProperty,
} from './fixtures';

const getUser = () => ({ _username: 'user 1', role: 'admin' });

describe('PX Routes (Paragraph extraction flow)', () => {
  const app: Application = setUpApp(paragraphExtractionRoutes, (req, _res, next) => {
    (req as any).user = getUser();
    next();
  });

  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
    tenants.current().featureFlags!.paragraphExtraction = true;
  });

  afterAll(async () => testingEnvironment.tearDown());

  describe('POST /api/paragraphExtraction/extractor', () => {
    it('should validate the input', async () => {
      const response = await request(app)
        .post('/api/paragraphExtraction/extractor')
        .send({ not_allowed_property: { key: 'value' } });

      expect(response.statusCode).toBe(422);
      expect(response.body.error).toContain('validation failed');
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

      expect(response.body.extractorId).toBe(extractors?.[0]._id.toString());
    });
  });
});
