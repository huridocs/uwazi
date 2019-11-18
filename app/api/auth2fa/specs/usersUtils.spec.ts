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
      await usersModel.save({ _id: userId, using2fa: true, secret: 'OLDSECRET' });
      const { secret } = await usersUtils.setSecret({ _id: userId });
      const [secretedUser] = await usersModel.get({ _id: userId }, '+secret');
      expect(secretedUser.secret).toBe('OLDSECRET');
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

  describe('enable2fa', () => {
    beforeEach(() => {
      spyOn(otplib.authenticator, 'verify').and.callFake(params => {
        if (params.token === 'correctToken' && params.secret === 'correctSecret') {
          return true;
        }
        return false;
      });
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
        const [enabledUser] = await usersModel.get({ _id: userId });
        expect(enabledUser.using2fa).toBe(true);
        fail('Should throw an error');
      } catch (err) {
        expect(err.code).toBe(409);
        expect(err.message).toMatch(/token does not validate/i);
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
