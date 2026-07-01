import { ObjectId } from 'mongodb';
import type { Application, NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { UserRole } from '#shared/types/userSchema.js';
import { userRoutes } from '../routes.js';
import { fixtures, f } from './fixtures.js';

jest.mock('../../../../../auth/encryptPassword.ts', () => ({
  encryptPassword: async () => Promise.resolve('hush hush super secret'),
}));

jest.mock('../../../../../auth/validatePasswordMiddleWare.ts', () => ({
  validatePasswordMiddleWare: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

const app: Application = setUpApp(
  userRoutes,
  (req: Request, _res: Response, next: NextFunction) => {
    req.user = { _id: f.idString('admin'), role: 'admin', username: 'admin' };
    next();
  }
);

describe('DELETE /api/users', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
    testingTenants.changeCurrentTenant({ featureFlags: { v2DeleteUser: true } });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('soft-deleting and validations', () => {
    beforeEach(async () => {
      await testingEnvironment.setFixtures(fixtures);
    });

    it('should soft delete a user and return 200', async () => {
      const response = await request(app)
        .delete('/api/users')
        .query({ ids: JSON.stringify([f.idString('existinguser')]) });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ acknowledged: true, deletedCount: 1 });

      const users = await testingEnvironment.db.getAllFrom('users');
      const deletedUser = users.find(user => user.username === 'existinguser');
      expect(deletedUser?.deletedAt).toBeDefined();

      const groups = await testingEnvironment.db.getAllFrom('usergroups');
      const allMemberRefIds = groups.flatMap(g => (g.members || []).map(m => m.refId?.toString()));
      expect(allMemberRefIds).not.toContain(f.id('existinguser').toString());
    });

    it('should return 422 when ids is missing', async () => {
      const response = await request(app).delete('/api/users');
      expect(response.status).toBe(422);
    });

    it('should return 422 when ids is invalid JSON', async () => {
      const response = await request(app).delete('/api/users').query({ ids: 'notjson' });
      expect(response.status).toBe(422);
    });

    it('should return 400 when trying to self delete', async () => {
      const response = await request(app)
        .delete('/api/users')
        .query({ ids: JSON.stringify([f.idString('admin')]) });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Users cannot delete themselves');
    });

    it('should return 400 when trying to delete the public user', async () => {
      const response = await request(app)
        .delete('/api/users')
        .query({ ids: JSON.stringify(['698c35e7cf8880419d91fe4d']) });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Cannot delete system users');
    });
  });

  describe('last valid user', () => {
    it('should return 400 because last active user cannot be deleted', async () => {
      await testingEnvironment.setUp({
        users: [
          f.user({ username: 'admin', role: UserRole.ADMIN, email: 'admin@test.com' }),
          f.user({
            username: 'deletedUser',
            role: UserRole.ADMIN,
            email: 'deleted@test.com',
            deletedAt: '1',
          }),
          {
            _id: new ObjectId('698c35e7cf8880419d91fe4d'),
            username: 'PublicUser',
            role: UserRole.COLLABORATOR,
            email: 'public@uwazi.local',
          },
        ],
        settings: [
          {
            site_name: 'Uwazi',
            languages: [{ key: 'en', label: 'English', default: true }],
          },
        ],
        usergroups: [],
      });
      testingTenants.changeCurrentTenant({ featureFlags: { v2DeleteUser: true } });

      const response = await request(app)
        .delete('/api/users')
        .query({ ids: JSON.stringify([f.idString('admin')]) });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Cannot delete last remaining user');
    });
  });
});
