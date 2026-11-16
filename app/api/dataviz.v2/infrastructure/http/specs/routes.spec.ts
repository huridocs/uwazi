import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';

import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import type { DBFixture } from '#api/utils/testing_db.js';
import { UserRole } from '#shared/types/userSchema.js';

import datavizRoutes from '../routes.js';

const fixtures: DBFixture = {
  settings: [{ languages: [{ default: true, key: 'en', label: 'English' }] }],
};

const admin = { _id: 'admin', username: 'admin', role: UserRole.ADMIN };
const editor = { _id: 'editor', username: 'editor', role: UserRole.EDITOR };

let currentUser: Request['user'] | undefined;

const app = setUpApp(datavizRoutes, (req: Request, _res: Response, next: NextFunction) => {
  if (currentUser) {
    req.user = currentUser;
  }
  next();
});

describe('dataviz routes', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  beforeEach(() => {
    currentUser = admin;
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('GET /api/dataviz', () => {
    it('should list the datavizs to admins', async () => {
      const response = await request(app).get('/api/dataviz');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ rows: [] });
    });
  });

  describe.each(['/api/dataviz', '/api/dataviz/000000000000000000000000'])('GET %s', route => {
    it.each([
      { role: 'anonymous', user: undefined },
      { role: 'editor', user: editor },
    ])('should reject $role users', async ({ user }) => {
      currentUser = user;

      const response = await request(app).get(route);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Unauthorized', message: 'Unauthorized' });
    });
  });
});
