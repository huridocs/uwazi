/** @format */

import * as otplib from 'otplib';

import db from 'api/utils/testing_db';
import usersModel from 'api/users/usersModel';
import settingsModel from 'api/settings/settings';
import { createError } from 'api/utils';

import * as usersUtils from '../usersUtils';
import fixtures, { userId, secretedUserId } from './fixtures';

function hasKey<O extends object>(obj: O, key: keyof any): key is keyof O {
  return key in obj;
}

type Error = { code: number; message: string };

describe('auth2fa userUtils', () => {
  beforeEach(async () => {
    await db.setupFixturesAndContext(fixtures);
  });

  afterAll(async () => {
    await db.disconnect();
  });

  const expectError = async (method: string, _id: any, token: string, err: Error) => {
    if (hasKey(usersUtils, method)) {
      try {
        await usersUtils[method]({ _id }, token);
        fail('Should throw error');
      } catch (e) {
        expect(e.code).toBe(err.code);
        expect(e.message.match(new RegExp(err.message, 'i'))).not.toBe(null);
      }
    } else {
      fail('No such method');
    }
  };

  const verifyUserNotFound = async (method: string) => {
    await expectError(method, db.id(), 'any token', { code: 403, message: 'user not found' });
  };

  const verifyTokenMock = (params: { token?: string; secret?: string }) => {
    if (params.token === 'correctToken' && params.secret === 'correctSecret') {
      return true;
    }
    return false;
  };

  describe('setSecret', () => {
    beforeEach(() => {
      jest.spyOn(otplib.authenticator, 'generateSecret').mockReturnValue('aVerySecretSecret');
    });

    it("should save the secret string on a non-previously-2fa'd user and return it along with the otpauth url", async () => {
      const { secret, otpauth } = await usersUtils.setSecret({ _id: userId });
      const [secretedUser] = await usersModel.get({ _id: userId }, '+secret');
      expect(secretedUser.secret).toBe(secret);
      expect(otpauth).toMatchSnapshot();
    });

    it('should truncate extremely long urls to prevent unreadable QR codes', async () => {
      await settingsModel.save({
        site_name: 'A very long? name, that should get truncated to avoid unreadable QR codes',
      });
      const { otpauth } = await usersUtils.setSecret({ _id: userId });
      expect(otpauth).toMatchSnapshot();
    });

    it("should not change a secret on a previously-2fa'd user", async () => {
      await usersModel.save({ _id: userId, using2fa: true, secret: 'OLDSECRET' });
      try {
        await usersUtils.setSecret({ _id: userId });
        fail('Should throw error');
      } catch (e) {
        const [secretedUser] = await usersModel.get({ _id: userId }, '+secret');
        expect(secretedUser.secret).toBe('OLDSECRET');
        expect(e).toEqual(createError('Unauthorized', 401));
      }
    });

    it('should throw if user not found', async () => {
      await verifyUserNotFound('setSecret');
    });
  });

  describe('verfiyToken', () => {
    beforeEach(() => {
      jest.spyOn(otplib.authenticator, 'verify').mockImplementation(verifyTokenMock);
    });

    it('should verify with valid token', async () => {
      const response = await usersUtils.verifyToken({ _id: secretedUserId }, 'correctToken');
      expect(response.validToken).toBe(true);
    });

    it('should fail with 401 when invalid token', async () => {
      const err = { code: 401, message: 'two-factor authentication failed' };
      await expectError('verifyToken', secretedUserId, 'any token', err);
    });

    it('should throw if user not found', async () => {
      await verifyUserNotFound('verifyToken');
    });
  });

  describe('enable2fa', () => {
    beforeEach(() => {
      jest.spyOn(otplib.authenticator, 'verify').mockImplementation(verifyTokenMock);
    });

    it('should set "using2fa" to true if token matches', async () => {
      const savedUser = await usersUtils.enable2fa({ _id: secretedUserId }, 'correctToken');
      const [enabledUser] = await usersModel.get({ _id: secretedUserId });
      expect(savedUser.using2fa).toBe(true);
      expect(enabledUser.using2fa).toBe(true);
    });

    it('should not set "using2fa" and throw if token does not match', async () => {
      const err = { code: 409, message: 'token does not validate' };
      await expectError('enable2fa', secretedUserId, 'any token', err);
    });

    it('should throw if user not found', async () => {
      await verifyUserNotFound('enable2fa');
    });
  });

  describe('reset2fa', () => {
    it('should set "using2fa" to false, and delete secret for sent user', async () => {
      await usersModel.save({ _id: secretedUserId, using2fa: true });
      const { _id, ...response } = await usersUtils.reset2fa({ _id: secretedUserId }); // eslint-disable-line
      const [resetUser] = await usersModel.get({ _id: secretedUserId }, '+secret');
      expect(response).toMatchSnapshot();
      expect(resetUser.using2fa).toBe(false);
      expect(resetUser.secret).toBe(null);
    });

    it('should throw if user not found', async () => {
      await verifyUserNotFound('reset2fa');
    });
  });
});
