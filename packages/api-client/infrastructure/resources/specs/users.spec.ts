import authRoutes from '#api/auth/routes.js';
import { userRoutes } from '#api/core/infrastructure/express/users/routes.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { UserRole } from '#shared/types/userSchema.js';
import type { Application } from 'express';

import { ServerApiError } from '../../../application/ServerApiError.js';
import { ParityHarness, callers } from './ParityHarness.js';

const factory = getFixturesFactory();
const harness = new ParityHarness((app: Application) => {
  userRoutes(app);
  authRoutes(app);
});

describe('users client', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({
      settings: [{ languages: [{ key: 'en', label: 'English', default: true }] }],
      users: [
        factory.user({ username: 'alice', role: UserRole.ADMIN }),
        factory.user({ username: 'bob', role: UserRole.COLLABORATOR }),
      ],
    });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('getAll should match GET /api/users for an admin', async () => {
    const http = await harness.as(callers.admin).http('/api/users');
    const client = await harness.as(callers.admin).client(async c => c.users.getAll());

    expect(http.status).toBe(200);
    expect(client).toEqual(http.body);
    expect(client).toHaveLength(2);
  });

  it.each([
    ['editor', callers.editor],
    ['anonymous', callers.anonymous],
  ])('getAll should be forbidden to %s, like GET /api/users', async (_name, caller) => {
    const http = await harness.as(caller).http('/api/users');
    const failure = harness.as(caller).client(async c => c.users.getAll());

    expect(http.status).toBe(401);
    await expect(failure).rejects.toBeInstanceOf(ServerApiError);
    await expect(failure).rejects.toMatchObject({ status: 401, body: http.body });
  });

  it.each([
    ['admin', callers.admin],
    ['anonymous', callers.anonymous],
  ])('getCurrent should match GET /api/user for %s', async (_name, caller) => {
    const http = await harness.as(caller).http('/api/user');
    const client = await harness.as(caller).client(async c => c.users.getCurrent());

    expect(http.status).toBe(200);
    expect(client).toEqual(http.body);
  });
});
