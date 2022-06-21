import request from 'supertest';
import { Application } from 'express';
import { setUpApp } from 'api/utils/testingRoutes';
import { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { PreserveRoutes } from '../routes';

import fixtures from './fixtures';

describe('entities get searchString', () => {
  const app: Application = setUpApp(PreserveRoutes);

  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures as DBFixture, 'preserve-index');
  });

  afterAll(async () => testingEnvironment.tearDown());

  describe('GET', () => {
    it('should create a template', async () => {
      const { body } = await request(app).get('/api/preserve');

      expect(body.token).toBe('AAA-BBB-CCC-000-111');
    });
  });
});
