/** @format */

import * as otplib from 'otplib';
import db from 'api/utils/testing_db';
import usersModel from 'api/users/usersModel';
import { createError } from 'api/utils';

import * as usersUtils from '../usersUtils';
import fixtures, { userId, secretedUserId } from './fixtures';

describe('auth2fa userUtils', () => {
  beforeEach(async () => {
    await db.clearAllAndLoad(fixtures);
  });

  afterAll(async () => {
    await db.disconnect();
  });

  const verifyTokenMock = (params: { token: string; secret: string }) => {
    if (params.token === 'correctToken' && params.secret === 'correctSecret') {
      return true;
    }
    return false;
  };

  describe('setSecret', () => {
    it("should save the secret string on a non-previously-2fa'd user", async () => {
      const { secret, otpauth } = await usersUtils.setSecret({ _id: userId });
      const [secretedUser] = await usersModel.get({ _id: userId }, '+secret');
      expect(secretedUser.secret).toBe(secret);
      expect(otpauth).toBe(
        otplib.authenticator.keyuri(secretedUser.username || '', 'Uwazi', secret)
      );
    });

    it("should not change a secret on a previously-2fa'd user", async () => {
      try {
        await usersModel.save({ _id: userId, using2fa: true, secret: 'OLDSECRET' });
        await usersUtils.setSecret({ _id: userId });
        fail('Should throw error');
      } catch (e) {
        const [secretedUser] = await usersModel.get({ _id: userId }, '+secret');
        expect(secretedUser.secret).toBe('OLDSECRET');
        expect(e).toEqual(createError('Unauthorized', 401));
      }
    });

    it('should throw if user not found', async () => {
      try {
        await usersUtils.setSecret({ _id: db.id() });
        fail('should throw error');
      } catch (e) {
        expect(e).toEqual(createError('User not found', 403));
      }
    });
  });

  describe('verfiyToken', () => {
    beforeEach(() => {
      spyOn(otplib.authenticator, 'verify').and.callFake(verifyTokenMock);
    });

    it('should verify with valid token', async () => {
      const response = await usersUtils.verifyToken({ _id: secretedUserId }, 'correctToken');
      expect(response.validToken).toBe(true);
    });

    it('should fail with 401 when invalid token', async () => {
      try {
        await usersUtils.verifyToken({ _id: secretedUserId }, 'incorrectToken');
        fail('Should throw error');
      } catch (e) {
        expect(e.code).toBe(401);
        expect(e.message).toMatch(/two-factor authentication failed/i);
      }
    });

    it('should throw if user not found', async () => {
      try {
        await usersUtils.verifyToken({ _id: db.id() }, 'any token');
        fail('should throw error');
      } catch (e) {
        expect(e).toEqual(createError('User not found', 403));
      }
    });
  });

  describe('enable2fa', () => {
    beforeEach(() => {
      spyOn(otplib.authenticator, 'verify').and.callFake(verifyTokenMock);
    });

    it('should set "using2fa" to true if token matches', async () => {
      const savedUser = await usersUtils.enable2fa({ _id: secretedUserId }, 'correctToken');
      const [enabledUser] = await usersModel.get({ _id: secretedUserId });
      expect(savedUser.using2fa).toBe(true);
      expect(enabledUser.using2fa).toBe(true);
    });

    it('should not set "using2fa" and throw if token does not match', async () => {
      try {
        await usersUtils.enable2fa({ _id: secretedUserId }, 'incorrectToken');
        fail('Should throw an error');
      } catch (e) {
        expect(e.code).toBe(409);
        expect(e.message).toMatch(/token does not validate/i);
      }
    });

    it('should throw if user not found', async () => {
      try {
        await usersUtils.enable2fa({ _id: db.id() }, 'any token');
        fail('should throw error');
      } catch (e) {
        expect(e).toEqual(createError('User not found', 403));
      }
    });
  });
});
