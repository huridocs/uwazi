import translations from 'api/i18n';
import { errorLog } from 'api/log';
import * as entitiesIndex from 'api/search/entitiesIndex';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { setUpApp } from 'api/utils/testingRoutes';
import { testingDB } from 'api/utils/testing_db';
import { Application, NextFunction } from 'express';
import request from 'supertest';
import { Logger } from 'winston';
import templateRoutes from '../routes';
import templates from '../templates';
import { fixtureFactory, fixtures, templateCommonProperties } from './fixtures/routesFixtures';

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

const templateToSave = {
  name: 'template4',
  properties: [],
  commonProperties: templateCommonProperties,
};

const emitToCurrentTenantSpy = jest.fn();

describe('templates routes', () => {
  const app: Application = setUpApp(templateRoutes, (req, _res, next: NextFunction) => {
    req.sockets = { emitToCurrentTenant: emitToCurrentTenantSpy };
    next();
  });

  const postToEndpoint = async (route: string, body: any, expectedCode = 200) =>
    request(app).post(route).send(body).expect(expectedCode);

  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures, 'templates_index');
    jest.spyOn(translations, 'updateContext').mockImplementation(async () => Promise.resolve('ok'));
  });

  afterAll(async () => testingEnvironment.tearDown());

  describe('GET', () => {
    it('should return all templates by default', async () => {
      const { body } = await request(app).get('/api/templates').expect(200);

      expect(JSON.stringify(body.rows)).toBe(JSON.stringify(fixtures.templates));
    });
  });

  describe('DELETE', () => {
    it('should delete a template', async () => {
      const templateId = fixtureFactory.id('template2');
      await request(app).delete(`/api/templates?_id=${templateId}`).expect(200);
      const remainingTemplates = await templates.get();
      expect(remainingTemplates).toContainEqual(expect.objectContaining({ name: 'template1' }));
      expect(remainingTemplates).toContainEqual(expect.objectContaining({ name: 'template3' }));
      expect(remainingTemplates).not.toContainEqual(expect.objectContaining({ name: 'template2' }));
    });

    it('should validate that request has _id', async () => {
      const { body } = await request(app).delete('/api/templates').expect(400);
      expect(body.error).toBe('validation failed');
    });
  });

  describe('POST', () => {
    it('should create a template', async () => {
      await postToEndpoint('/api/templates', templateToSave);

      const savedTemplates = await templates.get();

      expect(savedTemplates).toContainEqual(expect.objectContaining({ name: 'template4' }));
    });

    it('should update a existing template', async () => {
      const [firstTemplate] = await templates.get();
      const templateToUpdate = {
        ...firstTemplate,
        properties: [{ label: 'Numeric', type: 'numeric' }],
        commonProperties: templateCommonProperties,
        __v: 0,
      };

      await postToEndpoint('/api/templates', templateToUpdate);

      const [updatedTemplate] = await templates.get({ _id: templateToUpdate._id });
      expect(updatedTemplate.properties).toContainEqual(
        expect.objectContaining({ label: 'Numeric', type: 'numeric' })
      );
    });

    it('should not emit settings update when settings not modified', async () => {
      await postToEndpoint('/api/templates', templateToSave);

      expect(emitToCurrentTenantSpy).not.toHaveBeenCalledWith('updateSettings');
    });
  });

  describe('/templates/count_by_thesauri', () => {
    it('should return the number of templates using a thesauri', async () => {
      const { body } = await request(app)
        .get('/api/templates/count_by_thesauri?_id=123456789')
        .expect(200);

      expect(body).toBe(1);
    });
    it('should have a validation schema', async () => {
      const { body } = await request(app).get('/api/templates/count_by_thesauri');
      expect(body.error).toBe('validation failed');
    });
  });

  describe('/api/templates/setasdefault', () => {
    it('should call templates to set the new default', async () => {
      const template2Id = fixtureFactory.id('template2');
      await request(app).post('/api/templates/setasdefault').send({ _id: template2Id }).expect(200);

      const savedTemplates = await templates.get();

      expect(savedTemplates).toContainEqual(
        expect.objectContaining({ name: 'template1', default: false })
      );
      expect(savedTemplates).toContainEqual(
        expect.objectContaining({ name: 'template2', default: true })
      );
    });

    it('should have a validation schema', async () => {
      const { body } = await request(app).post('/api/templates/setasdefault');
      expect(body.error).toBe('validation failed');
    });
  });

  describe('mappings', () => {
    it('should throw an error if template is invalid vs the current elasticsearch mapping', async () => {
      await postToEndpoint('/api/templates', {
        ...templateToSave,
        properties: [
          {
            label: 'Numeric',
            type: 'numeric',
            name: 'numeric',
          },
        ],
      });
      const [savedTemplate] = await templates.get({ name: 'template4' });
      await postToEndpoint('/api/templates', {
        ...savedTemplate,
        properties: [],
      });
      const { body } = await postToEndpoint(
        '/api/templates',
        {
          ...savedTemplate,
          properties: [
            {
              label: 'Numeric',
              type: 'text',
              name: 'numeric',
            },
          ],
          reindex: false,
        },
        409
      );
      expect(body.error).toContain('conflict');
    });

    it('should throw an error if template is reusing a property name in same operation', async () => {
      await postToEndpoint('/api/templates', {
        ...templateToSave,
        properties: [
          {
            label: 'Numeric',
            type: 'numeric',
            name: 'numeric',
          },
        ],
      });
      const [savedTemplate] = await templates.get({ name: 'template4' });

      const { body } = await postToEndpoint(
        '/api/templates',
        {
          ...savedTemplate,
          properties: [
            {
              label: 'Numeric',
              type: 'text',
              name: 'numeric',
            },
          ],
          reindex: false,
        },
        400
      );

      expect(body.error).toContain('swap');
    });

    it('should check mapping of new added inherited properties', async () => {
      await testingEnvironment.setUp(fixtures, 'templates_index');
      const inheritPropId = testingDB.id();
      const inheritPropNum = testingDB.id();
      const templateA = {
        ...templateToSave,
        name: 'template A',
        properties: [
          { _id: inheritPropNum, name: 'num', type: 'numeric', label: 'Numeric' },
          { _id: inheritPropId, name: 'name', type: 'text', label: 'Name' },
        ],
        commonProperties: [{ name: 'title', type: 'text', label: 'Name' }],
      };

      await postToEndpoint('/api/templates', templateA);

      const templateB = {
        ...templateToSave,
        name: 'template B',
        properties: [
          {
            name: 'relationship',
            label: 'relationship',
            type: 'relationship',
            relationType: 'asdf',
            inherit: { property: inheritPropNum.toString() },
          },
        ],
      };
      await postToEndpoint('/api/templates', templateB);
      const [savedTemplate] = await templates.get({ name: 'template B' });

      savedTemplate.properties![0].inherit!.property = inheritPropId.toString();

      const { body } = await postToEndpoint('/api/templates', savedTemplate, 409);
      expect(body.error).toContain('conflict');
    });

    describe('when there is an error other than mapping conflict', () => {
      it('should throw the error', async () => {
        jest.spyOn(errorLog, 'error').mockImplementationOnce(() => ({} as Logger));
        jest.spyOn(entitiesIndex, 'updateMapping').mockImplementation(() => {
          throw new Error('not 409');
        });
        await postToEndpoint(
          '/api/templates',
          {
            ...templateToSave,
            properties: [
              {
                label: 'Numeric',
                type: 'numeric',
                name: 'numeric',
              },
            ],
          },
          500
        );
      });
    });
  });
});
