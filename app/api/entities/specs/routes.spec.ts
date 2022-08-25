import request, { Response as SuperTestResponse } from 'supertest';
import { Application, Request, Response, NextFunction } from 'express';

import db from 'api/utils/testing_db';
import { setUpApp } from 'api/utils/testingRoutes';

import routes from 'api/entities/routes';
import { AccessLevels, PermissionType } from 'shared/types/permissionSchema';
import { UserInContextMockFactory } from 'api/utils/testingUserInContext';
import { UserRole } from 'shared/types/userSchema';
import path from 'path';
import * as entitySavingManager from 'api/entities/entitySavingManager';
import templates from 'api/templates';
import thesauri from 'api/thesauri';
import fixtures, { permissions } from './fixtures';
import { errorLog } from 'api/log';

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
    await db.setupFixturesAndContext(fixtures);
  });

  afterAll(async () => db.disconnect());

  describe('GET', () => {
    it('return asked entities with permissions', async () => {
      const response: SuperTestResponse = await request(app)
        .get('/api/entities')
        .query({ sharedId: 'sharedPerm', include: JSON.stringify(['permissions']) });

      expect(response.body.rows[0].permissions.length).toBe(1);
      expect(response.body.rows[0].permissions).toEqual(permissions);
    });
  });

  describe('POST', () => {
    const entityToSave = {
      title: 'my entity',
    };

    beforeEach(() => {
      new UserInContextMockFactory().mock(user);
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

    it('should call the saving manager with the correct filenames', async () => {
      spyOn(entitySavingManager, 'saveEntity').and.callFake(async () =>
        Promise.resolve({ entity: {} })
      );
      spyOn(templates, 'getById').and.callFake(async () => Promise.resolve({}));
      spyOn(thesauri, 'templateToThesauri').and.callFake(async () => Promise.resolve({}));

      await request(app)
        .post('/api/entities')
        .field('entity', JSON.stringify(entityToSave))
        .attach('documents[0]', path.join(__dirname, 'Hello, World.pdf'), 'Nombre en español')
        .attach('documents[1]', path.join(__dirname, 'Hello, World.pdf'), 'Nombre en español 2')
        .attach('attachments[0]', path.join(__dirname, 'Hello, World.pdf'), 'Nombre en español 3')
        .attach('attachments[1]', path.join(__dirname, 'Hello, World.pdf'), 'Nombre en español 4')
        .field('documents_originalname[0]', 'Nombre en español')
        .field('documents_originalname[1]', 'Nombre en español 2')
        .field('attachments_originalname[0]', 'Nombre en español 3')
        .field('attachments_originalname[1]', 'Nombre en español 4');

      expect(entitySavingManager.saveEntity).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          files: [
            expect.objectContaining({ originalname: 'Nombre en español' }),
            expect.objectContaining({ originalname: 'Nombre en español 2' }),
            expect.objectContaining({ originalname: 'Nombre en español 3' }),
            expect.objectContaining({ originalname: 'Nombre en español 4' }),
          ],
        })
      );
    });

    it('should log a deprecation notice if no original name provided in body', async () => {
      spyOn(entitySavingManager, 'saveEntity').and.callFake(async () =>
        Promise.resolve({ entity: {} })
      );
      spyOn(templates, 'getById').and.callFake(async () => Promise.resolve({}));
      spyOn(thesauri, 'templateToThesauri').and.callFake(async () => Promise.resolve({}));
      spyOn(errorLog, 'debug');

      await request(app)
        .post('/api/entities')
        .field('entity', JSON.stringify(entityToSave))
        .attach('documents[0]', path.join(__dirname, 'Hello, World.pdf'), 'Nombre en español')
        .attach('documents[1]', path.join(__dirname, 'Hello, World.pdf'), 'Nombre en español 2')
        .attach('attachments[0]', path.join(__dirname, 'Hello, World.pdf'), 'Nombre en español 3')
        .attach('attachments[1]', path.join(__dirname, 'Hello, World.pdf'), 'Nombre en español 4');

      expect(errorLog.debug).toHaveBeenCalledWith(expect.stringContaining('Deprecation'));
    });
  });
});
