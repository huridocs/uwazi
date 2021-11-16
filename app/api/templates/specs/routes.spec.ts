import { Application, NextFunction } from 'express';
import request from 'supertest';
import { setUpApp } from 'api/utils/testingRoutes';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import translations from 'api/i18n';
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

const templateCommonProperties = [
  {
    _id: '6193bf8c86a5e87060962287',
    localID: 'commonTitle',
    label: 'Title',
    name: 'title',
    isCommonProperty: true,
    type: 'text',
    prioritySorting: false,
    generatedId: false,
  },
  {
    _id: '6193bf8c86a5e87060962288',
    localID: 'commonCreationDate',
    label: 'Date added',
    name: 'creationDate',
    isCommonProperty: true,
    type: 'date',
    prioritySorting: false,
  },
  {
    _id: '6193bf8c86a5e87060962289',
    localID: 'commonEditDate',
    label: 'Date modified',
    name: 'editDate',
    isCommonProperty: true,
    type: 'date',
    prioritySorting: false,
  },
];

const fixtureFactory = getFixturesFactory();
const fixtures = {
  templates: [
    {
      ...fixtureFactory.template('template1', []),
      commonProperties: templateCommonProperties,
    },
    fixtureFactory.template('template2', []),
    fixtureFactory.template('template3', []),
  ],
};

const emitToCurrentTenantSpy = jasmine.createSpy('emitToCurrentTenant');

describe('templates routes', () => {
  const app: Application = setUpApp(templateRoutes, (req, _res, next: NextFunction) => {
    (req as any).user = {
      role: UserRole.ADMIN,
      username: 'admin',
    };
    req.sockets = { emitToCurrentTenant: emitToCurrentTenantSpy };
    next();
  });

  const postToEnpoint = async (route: string, body: any) =>
    request(app)
      .post(route)
      .send(body)
      .expect(200);

  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures, 'templates_index');
    spyOn(translations, 'updateContext').and.returnValue(Promise.resolve());
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
    it('should create a template', async () => {
      const templateToSave = {
        name: 'template4',
        properties: [],
        commonProperties: templateCommonProperties,
      };

      await postToEnpoint('/api/templates', templateToSave);

      const savedTemplates = await templates.get();

      expect(savedTemplates).toContainEqual(expect.objectContaining({ name: 'template4' }));
    });

    it('should update a existing template', async () => {
      const [firstTemplate] = await templates.get();
      const templateToUpdate = {
        ...firstTemplate,
        properties: [{ label: 'Numeric', type: 'numeric', localID: 'z0x8wx8xy4' }],
        commonProperties: templateCommonProperties,
        __v: 0,
      };

      await postToEnpoint('/api/templates', templateToUpdate);

      const [updatedTemplate] = await templates.get({ _id: templateToUpdate._id });
      expect(updatedTemplate.properties).toContainEqual(
        expect.objectContaining({ label: 'Numeric', type: 'numeric', localID: 'z0x8wx8xy4' })
      );
    });

    it('should not emit settings update when settings not modified', async () => {
      const templateToSave = {
        name: 'new template',
        properties: [],
        commonProperties: templateCommonProperties,
      };

      await postToEnpoint('/api/templates', templateToSave);

      expect(emitToCurrentTenantSpy).not.toHaveBeenCalledWith('updateSettings');
    });
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
