import { ObjectId } from 'mongodb';
import type { Application, NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import { userRoutes } from '../routes.js';
import { fixtures, f } from './fixtures.js';
import { UserRole } from '#shared/types/userSchema.js';

jest.mock('../../../../../auth/encryptPassword.ts', () => ({
  encryptPassword: async () => Promise.resolve('hush hush super secret'),
}));

jest.mock('../../../../../auth/validatePasswordMiddleWare.ts', () => ({
  validatePasswordMiddleWare: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

const adminUser = { _id: f.idString('admin'), role: 'admin', username: 'admin' } as const;
const editorUser = {
  _id: f.idString('existinguser'),
  role: 'editor',
  username: 'existinguser',
} as const;

// Mutable so the `needsAuthorization()` case can downgrade the session; reset in beforeEach.
let currentUser: typeof adminUser | typeof editorUser = adminUser;

const app: Application = setUpApp(
  userRoutes,
  (req: Request, _res: Response, next: NextFunction) => {
    req.user = currentUser;
    next();
  }
);

const blockedUserId = new ObjectId();

const blockedFixtures = {
  ...fixtures,
  users: [
    ...(fixtures.users || []),
    {
      _id: blockedUserId,
      username: 'blockeduser',
      role: UserRole.EDITOR,
      email: 'blocked@test.com',
      password: 'hash',
      accountLocked: true,
      failedLogins: 10,
    },
  ],
};

describe('POST /api/users/unlock', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(blockedFixtures);
    currentUser = adminUser;
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should unlock the blocked user and return 200 with OK', async () => {
    const response = await request(app)
      .post('/api/users/unlock')
      .send({ _id: blockedUserId.toHexString() });

    expect(response.status).toBe(200);
    expect(response.body).toBe('OK');

    const user = await testingEnvironment.db
      .getCollection('users')!
      .findOne({ _id: blockedUserId });
    expect(user?.accountLocked).toBeUndefined();
    expect(user?.failedLogins).toBeUndefined();
    expect(user?.accountUnlockCode).toBeUndefined();
  });

  it('should return 422 when _id is missing', async () => {
    const response = await request(app).post('/api/users/unlock').send({});
    expect(response.status).toBe(422);
  });

  it.each([
    { name: 'an unknown property', body: { _id: blockedUserId.toHexString(), extra: 'extra' } },
    { name: 'a non-string _id', body: { _id: 0 } },
  ])('should return 422 for $name', async ({ body }) => {
    const response = await request(app).post('/api/users/unlock').send(body);

    expect(response.status).toBe(422);

    const user = await testingEnvironment.db
      .getCollection('users')!
      .findOne({ _id: blockedUserId });
    expect(user?.accountLocked).toBe(true);
  });

  it('should require an admin', async () => {
    currentUser = editorUser;

    const response = await request(app)
      .post('/api/users/unlock')
      .send({ _id: blockedUserId.toHexString() });

    expect(response.status).toBe(401);

    const user = await testingEnvironment.db
      .getCollection('users')!
      .findOne({ _id: blockedUserId });
    expect(user?.accountLocked).toBe(true);
  });
});
