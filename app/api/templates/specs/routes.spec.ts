import { Application, NextFunction } from 'express';
import request from 'supertest';
import { setUpApp } from 'api/utils/testingRoutes';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { UserRole } from 'shared/types/userSchema';
import templateRoutes from '../routes';
import templates from '../templates';

jest.mock(
  '../../auth/authMiddleware.ts',
  () => () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

jest.mock(
  '../../utils/languageMiddleware.ts',
  () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

const fixtureFactory = getFixturesFactory();
const fixtures = {
  templates: [
    fixtureFactory.template('template1', []),
    fixtureFactory.template('template2', []),
    fixtureFactory.template('template3', []),
  ],
};

describe('templates routes', () => {
  const app: Application = setUpApp(templateRoutes, (req, _res, next: NextFunction) => {
    (req as any).user = {
      role: UserRole.ADMIN,
      username: 'admin',
    };
    next();
  });

  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures, 'templates_index');
  });

  afterAll(async () => testingEnvironment.tearDown());

  describe('GET', () => {
    it('should return all templates by default', async () => {
      const { body } = await request(app)
        .get('/api/templates')
        .expect(200);

      expect(JSON.stringify(body.rows)).toBe(JSON.stringify(fixtures.templates));
    });
  });

  describe('DELETE', () => {
    it('should delete a template', async () => {
      await request(app)
        .delete(`/api/templates?_id=${fixtureFactory.template('template2', [])._id}`)
        .expect(200);
      const remainingTemplates = await templates.get();
      expect(remainingTemplates).toContainEqual(expect.objectContaining({ name: 'template1' }));
      expect(remainingTemplates).toContainEqual(expect.objectContaining({ name: 'template3' }));
      expect(remainingTemplates).not.toContainEqual(expect.objectContaining({ name: 'template2' }));
    });

    it('should validate that request has _id', async () => {
      const { body } = await request(app)
        .delete('/api/templates')
        .expect(400);
      expect(body.error).toBe('validation failed');
    });
  });

  describe('POST', () => {
    it('should create a template', async () => {});

    it('should not emit settings update when settings not modified', () => {});
  });

  describe('/templates/count_by_thesauri', () => {
    it('should have a validation schema', () => {});
    it('should return the number of templates using a thesauri', () => {});
  });

  describe('/api/templates/setasdefault', () => {
    it('should have a validation schema', () => {});

    it('should call templates to set the new default', () => {});
  });

  describe('check mappings', () => {
    it('should check if a template is valid vs the current elasticsearch mapping', () => {});
  });
});
