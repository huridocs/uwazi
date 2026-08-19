import request from 'supertest';
import { setUpApp } from '#api/utils/testingRoutes.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { legacyLogger } from '#api/log/index.js';
import documentRoutes from '../deprecatedRoutes.js';
import { fixtures } from './fixtures.js';
import { EntitiesDAOFactory } from '../../core/infrastructure/factories/EntitiesDAOFactory.js';

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
    let countSpy;
    beforeEach(() => {
      countSpy = jest.fn().mockResolvedValue(2);
      jest.spyOn(EntitiesDAOFactory, 'default').mockReturnValue({ count: countSpy });
    });
    afterEach(() => {
      jest.restoreAllMocks();
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
      expect(countSpy).toHaveBeenCalledWith({ template: 'templateId' });
      expect(response.body).toEqual(2);
    });
  });
});
