import * as otplib from 'otplib';
import type { Application, NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import { UserRole } from '#shared/types/userSchema.js';
import auth2faRoutes from '../routes.js';
import fixtures, { userId, secretedUserId } from './fixtures.js';

const appFor = (currentUserId: string, username: string): Application =>
  setUpApp(auth2faRoutes, (req: Request, _res: Response, next: NextFunction) => {
    req.user = { _id: currentUserId, role: UserRole.ADMIN, username };
    next();
  });

describe('POST /api/auth2fa-secret', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
    jest.spyOn(otplib.authenticator, 'generateSecret').mockReturnValue('aVerySecretSecret');
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should generate and persist a secret for the current user', async () => {
    const response = await request(appFor(userId.toHexString(), 'username'))
      .post('/api/auth2fa-secret')
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.secret).toBe('aVerySecretSecret');
    expect(response.body.otpauth).toContain('aVerySecretSecret');

    const user = await testingEnvironment.db.getCollection('users')!.findOne({ _id: userId });
    expect(user?.secret).toBe('aVerySecretSecret');
  });

  it('should return 400 for a soft-deleted user and write no secret', async () => {
    await testingEnvironment.db
      .getCollection('users')!
      .updateOne({ _id: userId }, { $set: { deletedAt: new Date() } });

    const response = await request(appFor(userId.toHexString(), 'username'))
      .post('/api/auth2fa-secret')
      .send({});

    expect(response.status).toBe(400);

    const user = await testingEnvironment.db.getCollection('users')!.findOne({ _id: userId });
    expect(user?.secret).toBeUndefined();
  });

  it('should return 400 when two-factor authentication is already enabled', async () => {
    await testingEnvironment.db
      .getCollection('users')!
      .updateOne({ _id: secretedUserId }, { $set: { using2fa: true } });

    const response = await request(appFor(secretedUserId.toHexString(), 'otheruser'))
      .post('/api/auth2fa-secret')
      .send({});

    expect(response.status).toBe(400);
  });
});
