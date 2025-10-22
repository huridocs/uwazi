import translations from 'api/i18n';
import * as entitiesIndex from 'api/search/entitiesIndex';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { setUpApp } from 'api/utils/testingRoutes';
import { Application, NextFunction } from 'express';
import request from 'supertest';
import templateRoutes from '../routes';
import templates from '../../../../../templates/templates';
import { fixtureFactory, fixtures } from './routesFixtures';

jest.mock(
  '../../../../../auth/authMiddleware.ts',
  () => () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

jest.mock(
  '../../../../../utils/languageMiddleware.ts',
  () => (_req: Request, _res: Response, next: NextFunction) => {
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
      await request(app).delete('/api/templates').expect(422);
    });
  });

  describe('POST', () => {
    describe('create', () => {
      it('should return created template', async () => {
        const template = { ...fixtureFactory.template('new template'), _id: undefined };
        const response = await postToEndpoint('/api/templates', template);
        if (response.status !== 200) {
          throw JSON.parse(response.text);
        }
        expect(JSON.parse(response.text).name).toBe('new template');
      });

      it('should return error when sending invalid template props', async () => {
        const template = {
          ...fixtureFactory.template('new template'),
          _id: undefined,
          invalid_prop: true,
        };
        const response = await request(app).post('/api/templates').send(template);

        expect(response.status).toBe(422);
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
        const response = await postToEndpoint('/api/templates', template);

        if (response.status !== 200) {
          throw JSON.parse(response.text);
        }

        expect(JSON.parse(response.text).name).toBe('backwards compatible template');
        expect(JSON.parse(response.text).default).toBe(false);
        expect(JSON.parse(response.text).processing).toEqual({ active: false });
        expect(JSON.parse(response.text).__v).toBeUndefined();
      });
    });

    describe('update', () => {
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

      it('should return updated template', async () => {
        const template = fixtureFactory.template('template1', [], { name: 'template1 updated' });
        const response = await postToEndpoint('/api/templates', template);
        if (response.status !== 200) {
          throw JSON.parse(response.text);
        }
        expect(JSON.parse(response.text).name).toBe('template1 updated');
      });
    });
  });

  describe('/templates/count_by_thesauri', () => {
    it('should return the number of templates using a thesauri', async () => {
      const { body } = await request(app)
        .get(`/api/templates/count_by_thesauri?_id=${fixtureFactory.id('123456789')}`)
        .expect(200);

      expect(body).toBe(1);
    });
    it('should have a validation schema', async () => {
      const { body } = await request(app).get('/api/templates/count_by_thesauri');

      expect(body.error).toContain('ValidationError');
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
      expect(body.error).toContain('ValidationError');
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
        422
      );

      expect(body.error).toContain('swap');
    });

    // eslint-disable-next-line max-statements
    it('should check mapping of new added inherited properties', async () => {
      await testingEnvironment.setUp(fixtures, 'templates_index');
      const templateA = {
        ...templateToSave,
        name: 'template A',
        properties: [
          { name: 'num', type: 'numeric', label: 'Numeric' },
          { name: 'name', type: 'text', label: 'Name' },
        ],
        commonProperties: [
          { name: 'title', type: 'text', label: 'Name' },
          { name: 'creationDate', type: 'date', label: 'Creation Date' },
          { name: 'editDate', type: 'date', label: 'Modified Date' },
        ],
      };

      await postToEndpoint('/api/templates', templateA);
      const [savedTemplateA] = await templates.get({ name: 'template A' });
      const [numericProp, textProp] = savedTemplateA.properties!;
      const templateB = {
        ...templateToSave,
        name: 'template B',
        properties: [
          {
            name: 'relationship',
            label: 'relationship',
            type: 'relationship',
            relationType: fixtureFactory.id('relation_type').toHexString(),
            content: savedTemplateA._id.toHexString(),
            inherit: { property: numericProp._id!.toString(), type: 'numeric' },
          },
        ],
      };
      await postToEndpoint('/api/templates', templateB);
      const [savedTemplate] = await templates.get({ name: 'template B' });

      savedTemplate.properties![0].inherit!.property = textProp._id!.toString();
      savedTemplate.properties![0].inherit!.type = 'text';

      const { body } = await postToEndpoint('/api/templates', savedTemplate, 409);
      expect(body.error).toContain('conflict');
    });

    describe('when there is an error other than mapping conflict', () => {
      it('should throw the error', async () => {
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

// describe('templates routes contract', () => {
//   const app: Application = setUpApp(templateRoutes, (req, _res, next: NextFunction) => {
//     req.sockets = { emitToCurrentTenant: emitToCurrentTenantSpy };
//     next();
//   });
//
//   const postToEndpoint = async (route: string, body: any) => request(app).post(route).send(body);
//
//   beforeAll(async () => {
//     await testingEnvironment.setUp({
//       settings: [
//         { site_name: 'Uwazi', languages: [{ key: 'en', label: 'English', default: true }] },
//       ],
//       templates: [
//         { ...f.template('template1', []), default: true },
//         { ...f.template('template2', []), default: false },
//       ],
//     });
//   });
//
//   afterAll(async () => testingEnvironment.tearDown());
//
//   describe('POST', () => {
//     describe('Create', () => {
//
//     });
//
//     describe('Update', () => {
//       it('should return updated template', async () => {
//         const template = f.template('template1', [], { name: 'template1 updated' });
//         const response = await postToEndpoint('/api/templates', template);
//         if (response.status !== 200) {
//           throw JSON.parse(response.text);
//         }
//         expect(JSON.parse(response.text).name).toBe('template1 updated');
//       });
//
//       it('should return error when sending invalid template props', async () => {
//         const template = f.template('template1', [], { invalid_prop: true });
//         const response = await postToEndpoint('/api/templates', template);
//
//         expect(response.status).toBe(422);
//         expect(response.text.match('invalid_prop')).toBeTruthy();
//       });
//
//       it('should allow specific (non valid) properties for backwards compatibility', async () => {
//         const template = f.template('template2', [], {
//           default: true,
//           processing: { active: true },
//           __v: 5,
//         });
//
//         const response = await postToEndpoint('/api/templates', template);
//
//         if (response.status !== 200) {
//           throw JSON.parse(response.text);
//         }
//
//         expect(JSON.parse(response.text).name).toBe('template2');
//         expect(JSON.parse(response.text).default).toBe(false);
//         expect(JSON.parse(response.text).processing).toEqual({ active: false });
//         expect(JSON.parse(response.text).__v).toBeUndefined();
//       });
//     });
//   });
// });
