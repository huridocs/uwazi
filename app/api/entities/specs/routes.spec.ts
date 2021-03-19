import request, { Response as SuperTestResponse } from 'supertest';
import { Application, Request, Response, NextFunction } from 'express';

import db from 'api/utils/testing_db';
import { setUpApp } from 'api/utils/testingRoutes';

import routes from 'api/entities/routes';
import { AccessLevels, PermissionType } from 'shared/types/permissionSchema';
import { UserInContextMockFactory } from 'api/utils/testingUserInContext';
import { UserRole } from 'shared/types/userSchema';
import fixtures, { permissions } from './fixtures';

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
    //@ts-ignore
    await db.clearAllAndLoad(fixtures);
  });

  afterAll(async () => db.disconnect());

  describe('GET', () => {
    it('return pdfInfo if asked in the request', async () => {
      const responseWithoutPdfInfo: SuperTestResponse = await request(app)
        .get('/api/entities')
        .query({ sharedId: 'shared' });

      expect(responseWithoutPdfInfo.body.rows[0].documents[0].pdfInfo).toBe(undefined);

      const responseWithPdfInfo: SuperTestResponse = await request(app)
        .get('/api/entities')
        .query({ sharedId: 'shared', withPdfInfo: true });

      const expectedPdfInfo = fixtures.files[2].pdfInfo;
      expect(responseWithPdfInfo.body.rows[0].documents[0].pdfInfo).toEqual(expectedPdfInfo);
    });

    it('return asked entities with permissions', async () => {
      const response: SuperTestResponse = await request(app)
        .get('/api/entities')
        .query({ sharedId: 'sharedPerm' });
      expect(response.body.rows[0].permissions.length).toBe(1);
      expect(response.body.rows[0].permissions).toEqual(permissions);
    });
  });

  describe('POST', () => {
    it('should return the permissions added to the entity', async () => {
      new UserInContextMockFactory().mock(user);
      const response: SuperTestResponse = await request(app)
        .post('/api/entities')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ title: 'newEntity' });
      expect(response.body).toEqual(
        expect.objectContaining({
          permissions: [
            {
              refId: user._id.toString(),
              type: PermissionType.USER,
              level: AccessLevels.WRITE,
            },
          ],
        })
      );
    });
  });
});
