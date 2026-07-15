import request from 'supertest';
import { setUpApp } from '#api/utils/testingRoutes.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { legacyLogger } from '#api/log/index.js';
import documentRoutes from '../deprecatedRoutes.js';
import { fixtures } from './fixtures.js';
import templates from '../../core/v1_layer/templates/index.js';

jest.mock('../../utils/languageMiddleware.ts', () => (req, _res, next) => {
  req.language = 'es';
  next();
});

describe('documents', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  const app = setUpApp(documentRoutes);

  describe('/api/documents/count_by_template', () => {
    beforeEach(() => {
      jest.spyOn(templates, 'countByTemplate').mockImplementation(async () => Promise.resolve(2));
    });
    it('should return a validation error if templateId is not passed', async () => {
      const response = await request(app).get('/api/documents/count_by_template').query({});

      expect(response.status).toBe(400);
      expect(response.body.errors[0].keyword).toBe('required');
      expect(response.body.errors[0].instancePath).toBe('/query');
      expect(response.body.error).toBe('validation failed');
    });
    it('should return count of documents using a specific template', async () => {
      jest.spyOn(legacyLogger, 'info').mockImplementation(() => ({}));
      const response = await request(app)
        .get('/api/documents/count_by_template')
        .query({ templateId: 'templateId' });
      expect(templates.countByTemplate).toHaveBeenCalledWith('templateId');
      expect(response.body).toEqual(2);
    });
  });

});
