import { Application, NextFunction, Request, Response } from 'express';
import request, { Response as SuperTestResponse } from 'supertest';
import path from 'path';

import { setUpApp } from '#api/utils/testingRoutes.js';
import db from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import routes from '#api/entities/routes.js';
import { appContext } from '#api/utils/AppContext.js';
import { UserInContextMockFactory } from '#api/utils/testingUserInContext.js';
import { AccessLevels, PermissionType } from '#shared/types/permissionSchema.js';
import { UserRole } from '#shared/types/userSchema.js';
import entities from '../entities.js';
import { RequestEntityTranslation } from '#api/externalIntegrations.v2/automaticTranslation/RequestEntityTranslation.js';
import { SaveEntityTranslations } from '#api/externalIntegrations.v2/automaticTranslation/SaveEntityTranslations.js';
import fixtures, { templateId } from './fixtures.js';

jest.mock(
  '../../auth/authMiddleware.ts',
  () => () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

describe('entities routes', () => {
  const user = {
    _id: db.id(),
    role: UserRole.COLLABORATOR,
    username: 'user 1',
    email: 'user@test.com',
  };
  const app: Application = setUpApp(routes, (req: Request, _res: Response, next: NextFunction) => {
    (req as any).user = user;
    next();
  });

  beforeEach(async () => {
    // @ts-ignore
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => testingEnvironment.tearDown());

  describe('POST', () => {
    const entityToSave = {
      title: 'my entity',
    };

    beforeEach(() => {
      new UserInContextMockFactory().mock(user);
    });

    describe('coerce_values', () => {
      describe('happy path', () => {
        it('should coerce numbers from strings', async () => {
          const valuesToCoerce = { type: 'numeric', value: '12' };
          new UserInContextMockFactory().mock(user);
          const response: SuperTestResponse = await request(app)
            .post('/api/entities/coerce_value')
            .send(valuesToCoerce);

          expect(response.body).toMatchObject({
            success: true,
            value: 12,
          });
        });

        it('should coerce dates from strings', async () => {
          const valuesToCoerce = { type: 'date', value: 'November 2001', locale: 'en' };
          new UserInContextMockFactory().mock(user);
          const response: SuperTestResponse = await request(app)
            .post('/api/entities/coerce_value')
            .send(valuesToCoerce);

          expect(response.body).toMatchObject({
            success: true,
            value: 1004572800,
          });
        });

        it('should coerce strings by removing new lines and breaks', async () => {
          const valuesToCoerce = {
            type: 'text',
            value: `this is
            a text`,
            locale: 'en',
          };
          new UserInContextMockFactory().mock(user);
          const response: SuperTestResponse = await request(app)
            .post('/api/entities/coerce_value')
            .send(valuesToCoerce);

          expect(response.body).toMatchObject({
            success: true,
            value: 'this is a text',
          });
        });
      });

      describe('sad path', () => {
        it('should fail coercing numbers from invalid strings', async () => {
          const valuesToCoerce = { type: 'numeric', value: 'error' };
          new UserInContextMockFactory().mock(user);
          const response: SuperTestResponse = await request(app)
            .post('/api/entities/coerce_value')
            .send(valuesToCoerce);

          expect(response.body).toMatchObject({
            success: false,
          });
        });

        it('should fail coercing dates from invalid strings', async () => {
          const valuesToCoerce = { type: 'date', value: 'whatever date', locale: 'en' };
          new UserInContextMockFactory().mock(user);
          const response: SuperTestResponse = await request(app)
            .post('/api/entities/coerce_value')
            .send(valuesToCoerce);

          expect(response.body).toMatchObject({
            success: false,
          });
        });
      });
    });

    it('should return saved entity when passed as data (`legacy`) with its permissions', async () => {
      new UserInContextMockFactory().mock(user);
      const response: SuperTestResponse = await request(app)
        .post('/api/entities')
        .send(entityToSave);
      expect(response.body).toMatchObject({
        title: 'my entity',
        permissions: [
          {
            refId: user._id.toString(),
            type: PermissionType.USER,
            level: AccessLevels.WRITE,
          },
        ],
      });
    });

    it('should return the saved entity when passed as a field with its permissions', async () => {
      const response: SuperTestResponse = await request(app)
        .post('/api/entities')
        .field('entity', JSON.stringify(entityToSave));

      expect(response.body).toMatchObject({
        entity: {
          title: 'my entity',
          permissions: [
            {
              refId: user._id.toString(),
              type: PermissionType.USER,
              level: AccessLevels.WRITE,
            },
          ],
        },
        errors: [],
      });
    });

    describe('V2 entity creation with files (multipart with documents and attachments)', () => {
      const createEntityWithFiles = async () => {
        new UserInContextMockFactory().mock(user);

        const newEntity = {
          title: 'Entity with files V2',
          template: templateId.toString(),
        };

        const response = await request(app)
          .post('/api/entities')
          .field('entity', JSON.stringify(newEntity))
          .attach('documents[0]', path.join(__dirname, 'Hello, World.pdf'), 'Document 1.pdf')
          .attach('documents[1]', path.join(__dirname, 'Hello, World.pdf'), 'Document 2.pdf')
          .attach('attachments[0]', path.join(__dirname, 'Hello, World.pdf'), 'Attachment 1.pdf')
          .attach('attachments[1]', path.join(__dirname, 'Hello, World.pdf'), 'Attachment 2.pdf')
          .field('documents_originalname[0]', 'Custom Doc 1.pdf')
          .field('documents_originalname[1]', 'Custom Doc 2.pdf')
          .field('attachments_originalname[0]', 'Custom Att 1.pdf')
          .field('attachments_originalname[1]', 'Custom Att 2.pdf')
          .expect(200);

        return response;
      };

      it('should return V1-compatible response format', async () => {
        const response = await createEntityWithFiles();

        expect(response.body).toMatchObject({
          entity: expect.objectContaining({
            title: 'Entity with files V2',
            sharedId: expect.any(String),
            template: templateId.toString(),
            permissions: expect.arrayContaining([
              expect.objectContaining({
                refId: user._id.toString(),
                type: PermissionType.USER,
                level: AccessLevels.WRITE,
              }),
            ]),
          }),
          errors: [],
        });
      });

      it('should create entity in all languages (en, es, pt)', async () => {
        const response = await createEntityWithFiles();
        const { sharedId } = response.body.entity;

        await appContext.run(async () => {
          const allLanguages = await entities.get({ sharedId });
          expect(allLanguages).toHaveLength(3);

          const languages = allLanguages.map((e: any) => e.language).sort();
          expect(languages).toEqual(['en', 'es', 'pt']);
        });
      });

      it('should replicate title and template across all language versions', async () => {
        const response = await createEntityWithFiles();
        const { sharedId } = response.body.entity;

        await appContext.run(async () => {
          const allLanguages = await entities.get({ sharedId });
          allLanguages.forEach((entity: any) => {
            expect(entity.title).toBe('Entity with files V2');
            expect(entity.template?.toString()).toBe(templateId.toString());
          });
        });
      });

      it('should attach 2 documents and 2 attachments', async () => {
        const response = await createEntityWithFiles();
        const { sharedId } = response.body.entity;

        const [entityWithFiles] = await entities.getUnrestrictedWithDocuments({
          sharedId,
          language: 'en',
        });

        expect(entityWithFiles.documents).toHaveLength(2);
        expect(entityWithFiles.attachments).toHaveLength(2);
      });

      it('should preserve custom originalnames from body fields', async () => {
        const response = await createEntityWithFiles();
        const { sharedId } = response.body.entity;

        const [entityWithFiles] = await entities.getUnrestrictedWithDocuments({
          sharedId,
          language: 'en',
        });

        expect(entityWithFiles.documents?.[0].originalname).toBe('Custom Doc 1.pdf');
        expect(entityWithFiles.documents?.[1].originalname).toBe('Custom Doc 2.pdf');
        expect(entityWithFiles.attachments?.[0].originalname).toBe('Custom Att 1.pdf');
        expect(entityWithFiles.attachments?.[1].originalname).toBe('Custom Att 2.pdf');
      });
    });

    it('should create entity with files using multipart header originalname as fallback', async () => {
      new UserInContextMockFactory().mock(user);

      const newEntity = {
        title: 'Entity fallback originalname',
        template: templateId.toString(),
      };

      const response = await request(app)
        .post('/api/entities')
        .field('entity', JSON.stringify(newEntity))
        .attach('documents[0]', path.join(__dirname, 'Hello, World.pdf'), 'Fallback Doc.pdf')
        .attach('attachments[0]', path.join(__dirname, 'Hello, World.pdf'), 'Fallback Att.pdf')
        // Note: NO documents_originalname or attachments_originalname fields
        .expect(200);

      const { sharedId } = response.body.entity;

      // Verify files use fallback originalnames from multipart header
      const [entityWithFiles] = await entities.getUnrestrictedWithDocuments({
        sharedId,
        language: 'en',
      });

      expect(entityWithFiles.documents).toHaveLength(1);
      expect(entityWithFiles.attachments).toHaveLength(1);
      expect(entityWithFiles.documents?.[0].originalname).toBe('Fallback Doc.pdf');
      expect(entityWithFiles.attachments?.[0].originalname).toBe('Fallback Att.pdf');
    });

    it('should create entity with only documents (no attachments)', async () => {
      new UserInContextMockFactory().mock(user);

      const newEntity = {
        title: 'Entity with docs only',
        template: templateId.toString(),
      };

      const response = await request(app)
        .post('/api/entities')
        .field('entity', JSON.stringify(newEntity))
        .attach('documents[0]', path.join(__dirname, 'Hello, World.pdf'), 'Doc Only 1.pdf')
        .attach('documents[1]', path.join(__dirname, 'Hello, World.pdf'), 'Doc Only 2.pdf')
        .field('documents_originalname[0]', 'Doc Only 1.pdf')
        .field('documents_originalname[1]', 'Doc Only 2.pdf')
        .expect(200);

      const { sharedId } = response.body.entity;

      const [entityWithFiles] = await entities.getUnrestrictedWithDocuments({
        sharedId,
        language: 'en',
      });

      expect(entityWithFiles.documents).toHaveLength(2);
      expect(entityWithFiles.attachments || []).toHaveLength(0);
    });

    it('should create entity with only attachments (no documents)', async () => {
      new UserInContextMockFactory().mock(user);

      const newEntity = {
        title: 'Entity with attachments only',
        template: templateId.toString(),
      };

      const response = await request(app)
        .post('/api/entities')
        .field('entity', JSON.stringify(newEntity))
        .attach('attachments[0]', path.join(__dirname, 'Hello, World.pdf'), 'Att Only 1.pdf')
        .attach('attachments[1]', path.join(__dirname, 'Hello, World.pdf'), 'Att Only 2.pdf')
        .field('attachments_originalname[0]', 'Att Only 1.pdf')
        .field('attachments_originalname[1]', 'Att Only 2.pdf')
        .expect(200);

      const { sharedId } = response.body.entity;

      const [entityWithFiles] = await entities.getUnrestrictedWithDocuments({
        sharedId,
        language: 'en',
      });

      expect(entityWithFiles.documents || []).toHaveLength(0);
      expect(entityWithFiles.attachments).toHaveLength(2);
    });

    describe('V2 entity update', () => {
      it('should update an existing entity via UpdateEntityController', async () => {
        new UserInContextMockFactory().mock(user);

        const entityToUpdate = {
          _id: 'abc123',
          sharedId: 'shared',
          title: 'updated title',
          language: 'en',
          template: templateId.toString(),
        };

        const response: SuperTestResponse = await request(app)
          .post('/api/entities')
          .send(entityToUpdate)
          .expect(200);

        expect(response.body).toMatchObject({
          sharedId: 'shared',
        });
      });

      it('should preserve AI translated text when user edit has pending prefix (AT conflict)', async () => {
        new UserInContextMockFactory().mock(user);

        // Set up AT config with template_test as an AT template
        await db.mongodb?.collection('settings').updateOne(
          {},
          {
            $set: {
              'features.automaticTranslation': {
                active: true,
                templates: [
                  {
                    template: templateId.toString(),
                    properties: [],
                    commonProperties: ['title'],
                  },
                ],
              },
            },
          }
        );

        // Seed the entity with an AI-translated title
        await db.mongodb
          ?.collection('entities')
          .updateOne(
            { sharedId: 'shared', language: 'en' },
            { $set: { title: `${SaveEntityTranslations.AITranslatedText} Hello` } }
          );

        const entityToUpdate = {
          _id: 'abc123',
          sharedId: 'shared',
          title: `${RequestEntityTranslation.AITranslationPendingText} Hello`,
          language: 'en',
          template: templateId.toString(),
        };

        const response: SuperTestResponse = await request(app)
          .post('/api/entities')
          .send(entityToUpdate)
          .expect(200);

        expect(response.body).toMatchObject({
          sharedId: 'shared',
        });

        const updatedEntity = await entities.getById('shared', 'en');
        expect(updatedEntity?.title).toBe(`${SaveEntityTranslations.AITranslatedText} Hello`);
      });

      it('should update an existing entity with files via UpdateEntityController', async () => {
        new UserInContextMockFactory().mock(user);

        const entityToUpdate = {
          _id: 'abc123',
          sharedId: 'shared',
          title: 'updated title with files',
          language: 'en',
          template: templateId.toString(),
        };

        const response: SuperTestResponse = await request(app)
          .post('/api/entities')
          .field('entity', JSON.stringify(entityToUpdate))
          .attach('documents[0]', path.join(__dirname, 'Hello, World.pdf'), 'Nombre en español')
          .field('documents_originalname[0]', 'Nombre en español')
          .expect(200);

        expect(response.body).toMatchObject({
          entity: expect.objectContaining({
            sharedId: 'shared',
          }),
          errors: [],
        });
      });

      it('should return entity payload for legacy JSON update requests', async () => {
        new UserInContextMockFactory().mock(user);

        const entityToUpdate = {
          _id: 'abc123',
          sharedId: 'shared',
          title: 'updated title',
          language: 'en',
          template: templateId.toString(),
        };

        const response: SuperTestResponse = await request(app)
          .post('/api/entities')
          .send(entityToUpdate);

        expect(response).toHaveStatus(200);

        expect(response.body).toMatchObject({
          sharedId: 'shared',
        });
      });
    });
  });
});
