import { setUpApp } from 'api/utils/testingRoutes';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import request from 'supertest';
import { UserRole } from 'shared/types/userSchema';
import documentRoutes from '../deprecatedRoutes.js';
import documents from '../documents';
import { fixtures } from './fixtures';
import templates from '../../templates';

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

  let currentUser;

  const adminUser = {
    username: 'User 1',
    role: UserRole.ADMIN,
    email: 'user@test.com',
  };

  function getUser() {
    return currentUser;
  }

  const app = setUpApp(documentRoutes, (req, _res, next) => {
    req.user = getUser();
    next();
  });

  describe('POST', () => {
    let req;

    const document = { title: 'Batman begins' };
    beforeEach(() => {
      req = {
        body: document,
        user: { _id: 'admin1', username: 'admin' },
        language: 'es',
      };
    });

    it('should need authorization', async () => {
      jest.spyOn(documents, 'save').mockImplementation(async () => Promise.resolve('document'));
      await request(app).post('/api/documents').send(req).expect(401);
    });

    it('should create a new document with current user', async () => {
      jest.spyOn(documents, 'save').mockImplementation(async () => Promise.resolve('document'));
      currentUser = adminUser;
      const response = await request(app).post('/api/documents').send(document);
      expect(response.body).toBe('document');
      expect(documents.save).toHaveBeenCalledWith(document, {
        user: adminUser,
        language: req.language,
      });
    });
  });

  describe('GET /api/documents', () => {
    beforeEach(() => {
      jest.spyOn(documents, 'getById').mockImplementation(async () => Promise.resolve('documents'));
    });

    it('should return documents.get', async () => {
      const response = await request(app).get('/api/documents').query({ _id: 'id' });
      expect(documents.getById).toHaveBeenCalledWith('id', 'es');
      expect(response.body).toEqual({ rows: ['documents'] });
    });
  });

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
      const response = await request(app)
        .get('/api/documents/count_by_template')
        .query({ templateId: 'templateId' });
      expect(templates.countByTemplate).toHaveBeenCalledWith('templateId');
      expect(response.body).toEqual(2);
    });
  });

  describe('DELETE', () => {
    beforeEach(() => {
      jest
        .spyOn(documents, 'delete')
        .mockImplementation(async () => Promise.resolve({ json: 'ok' }));
    });

    it('should return a validation error if sharedId is not passed', async () => {
      currentUser = adminUser;
      const response = await request(app).delete('/api/documents').send({});

      expect(response.status).toBe(400);
      expect(response.body.errors[0].keyword).toBe('required');
      expect(response.body.errors[0].instancePath).toBe('/query');
      expect(response.body.error).toBe('validation failed');
    });

    it('should use documents to delete it', async () => {
      currentUser = adminUser;
      await request(app).delete('/api/documents').query({ sharedId: 123 });
      expect(documents.delete).toHaveBeenCalledWith('123');
    });
  });
});
