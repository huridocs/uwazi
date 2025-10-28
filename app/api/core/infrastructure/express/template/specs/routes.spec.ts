import * as entitiesIndex from 'api/search/entitiesIndex';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { setUpApp } from 'api/utils/testingRoutes';
import { Application, NextFunction } from 'express';
import { TemplateSchema } from 'shared/types/templateType';
import request from 'supertest';
import templateRoutes from '../routes';
import { fixtureFactory, fixtures } from './routesFixtures';

jest.mock(
  '../../../../../auth/authMiddleware.ts',
  () => () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

const templateToSave = fixtureFactory.template('template4', [], { _id: undefined });

const emitToCurrentTenantSpy = jest.fn();

describe('templates routes', () => {
  const app: Application = setUpApp(templateRoutes, (req, _res, next: NextFunction) => {
    req.sockets = { emitToCurrentTenant: emitToCurrentTenantSpy };
    next();
  });

  const requestAllTemplates = async () => {
    const {
      body: { rows: templates },
    } = await request(app).get('/api/templates');
    return templates;
  };

  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures, true);
  });

  afterAll(async () => testingEnvironment.tearDown());

  describe('GET', () => {
    it('should return all templates by default', async () => {
      const response = await request(app).get('/api/templates');

      expect(response).toHaveStatus(200);
      expect(JSON.stringify(response.body.rows)).toBe(JSON.stringify(fixtures.templates));
    });
  });

  describe('DELETE', () => {
    it('should delete a template', async () => {
      const templateId = fixtureFactory.id('template2');
      await request(app).delete(`/api/templates?_id=${templateId}`).expect(200);

      const remainingTemplates = await requestAllTemplates();

      expect(remainingTemplates).toContainEqual(expect.objectContaining({ name: 'template1' }));
      expect(remainingTemplates).toContainEqual(expect.objectContaining({ name: 'template3' }));
      expect(remainingTemplates).not.toContainEqual(expect.objectContaining({ name: 'template2' }));
    });

    it('should validate that request has _id', async () => {
      await request(app).delete('/api/templates').expect(422);
    });
  });

  describe('POST', () => {
    describe('create', () => {
      it('should return created template', async () => {
        const template = { ...fixtureFactory.template('new template'), _id: undefined };

        const response = await request(app).post('/api/templates').send(template);

        expect(response).toHaveStatus(200);
        expect(response.body.name).toBe('new template');
      });

      it('should return error when sending invalid template props', async () => {
        const template = {
          ...fixtureFactory.template('new template'),
          _id: undefined,
          invalid_prop: true,
        };

        const response = await request(app).post('/api/templates').send(template);
        expect(response).toHaveStatus(422);
        expect(response.text.match('invalid_prop')).toBeTruthy();
      });

      it('should allow specific (non valid) properties for backwards compatibility', async () => {
        const template = {
          ...fixtureFactory.template('backwards compatible template'),
          _id: undefined,
          default: true,
          processing: { active: true },
          __v: 5,
        };
        const response = await request(app).post('/api/templates').send(template);

        expect(response).toHaveStatus(200);

        expect(response.body).toMatchObject({
          name: 'backwards compatible template',
          default: false,
          processing: { active: false },
        });
        expect(response.body.__v).toBeUndefined();
      });
    });

    describe('update', () => {
      it('should update a existing template', async () => {
        const [firstTemplate] = await requestAllTemplates();
        const template = {
          ...firstTemplate,
          properties: [{ label: 'Numeric', type: 'numeric' }],
          __v: 0,
        };

        const response = await request(app).post('/api/templates').send(template);

        expect(response).toHaveStatus(200);

        const allTemplates = await requestAllTemplates();

        const updatedTemplate = allTemplates.find((t: TemplateSchema) => t._id === template._id);

        expect(updatedTemplate.properties).toContainEqual(
          expect.objectContaining({ label: 'Numeric', type: 'numeric' })
        );
      });
      it('should not emit settings update when settings not modified', async () => {
        const response = await request(app).post('/api/templates').send(templateToSave);

        expect(response).toHaveStatus(200);
        expect(emitToCurrentTenantSpy).not.toHaveBeenCalledWith('updateSettings');
      });

      it('should return updated template', async () => {
        const template = fixtureFactory.template('template1', [], { name: 'template1 updated' });
        const response = await request(app).post('/api/templates').send(template);

        expect(response).toHaveStatus(200);
        expect(JSON.parse(response.text).name).toBe('template1 updated');
      });

      it('should return error when sending invalid template props', async () => {
        const template = fixtureFactory.template('template1', [], { invalid_prop: true });
        const response = await request(app).post('/api/templates').send(template);

        expect(response).toHaveStatus(422);
        expect(response.text.match('invalid_prop')).toBeTruthy();
      });

      it('should allow specific (non valid) properties for backwards compatibility', async () => {
        const allTemplates = await requestAllTemplates();

        const nonDefaultTemplate = allTemplates.find((t: TemplateSchema) => t.default === false);

        const response = await request(app)
          .post('/api/templates')
          .send({
            ...nonDefaultTemplate,
            default: true,
            processing: { active: true },
            __v: 5,
          });

        expect(response).toHaveStatus(200);
        expect(response.body).toMatchObject({
          name: nonDefaultTemplate.name,
          default: false,
          processing: { active: false },
        });
        expect(response.body.__v).toBeUndefined();
      });
    });
  });

  describe('/templates/count_by_thesauri', () => {
    it('should return the number of templates using a thesauri', async () => {
      const response = await request(app).get(
        `/api/templates/count_by_thesauri?_id=${fixtureFactory.id('123456789')}`
      );

      expect(response).toHaveStatus(200);
      expect(response.body).toBe(1);
    });

    it('should have a validation schema (_id is required)', async () => {
      const response = await request(app).get('/api/templates/count_by_thesauri');
      expect(response).toHaveStatus(422);
      expect(response.body.error).toContain('ValidationError');
    });
  });

  describe('/api/templates/setasdefault', () => {
    it('should set template as new default', async () => {
      const { body: newDefaultTemplate } = await request(app)
        .post('/api/templates')
        .send(fixtureFactory.template('new_default', [], { _id: undefined }));

      expect(
        await request(app).post('/api/templates/setasdefault').send({ _id: newDefaultTemplate._id })
      ).toHaveStatus(200);

      const {
        body: { rows: savedTemplates },
      } = await request(app).get('/api/templates');

      const defaultTemplates = savedTemplates.filter((t: TemplateSchema) => t.default === true);

      expect(defaultTemplates).toMatchObject([{ name: 'new_default' }]);
    });

    it('should have a validation schema (_id is required)', async () => {
      const response = await request(app).post('/api/templates/setasdefault');
      expect(response).toHaveStatus(422);
      expect(response.body.error).toContain('ValidationError');
    });
  });

  describe('mappings', () => {
    it('should throw an error if the elasticsearch mappings is in conflict with the updated template', async () => {
      const { body: updatedTemplate } = await request(app)
        .post('/api/templates')
        .send(
          fixtureFactory.template(
            'mapping_conflict_template',
            [{ label: 'new_numeric_field', type: 'numeric', name: 'new_numeric_field' }],
            { _id: undefined }
          )
        );

      await request(app)
        .post('/api/templates')
        .send({ ...updatedTemplate, properties: [] });

      const response = await request(app)
        .post('/api/templates')
        .send({
          ...updatedTemplate,
          properties: [{ label: 'new_numeric_field', type: 'text', name: 'new_numeric_field' }],
          reindex: false,
        });

      expect(response).toHaveStatus(409);
      expect(response.body.error).toContain('conflict');
    });

    it('should throw an error if template is reusing a property name in same operation', async () => {
      const { body: updatedTemplate } = await request(app)
        .post('/api/templates')
        .send(
          fixtureFactory.template(
            'reusing_prop_name',
            [{ label: 'Numeric', type: 'numeric', name: 'numeric' }],
            { _id: undefined }
          )
        );

      const response = await request(app)
        .post('/api/templates')
        .send({
          ...updatedTemplate,
          properties: [{ label: 'Numeric', type: 'text', name: 'numeric' }],
          reindex: false,
        });

      expect(response).toHaveStatus(422);
      expect(response.body.error).toContain('swap');
    });

    describe('when there is an error other than mapping conflict', () => {
      it('should throw the error', async () => {
        jest.spyOn(entitiesIndex, 'updateMapping').mockImplementation(() => {
          throw new Error('not 409');
        });

        const response = await request(app)
          .post('/api/templates')
          .send(fixtureFactory.template('error_template', [], { _id: undefined }));

        expect(response).toHaveStatus(500);
      });
    });
  });
});
