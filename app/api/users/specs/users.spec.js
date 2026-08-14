/* eslint-disable max-statements */
import { createError } from '#api/utils/index.js';
import mailer from '#api/utils/mailer.js';
import db from '#api/utils/testing_db.js';
import { comparePasswords, encryptPassword } from '#api/auth/encryptPassword.js';
import { settingsModel } from '#api/settings/settingsModel.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import * as unlockCode from '../generateUnlockCode.js';
import passwordRecoveriesModel from '../passwordRecoveriesModel.js';
import users from '../users.js';
import usersModel from '../usersModel.js';
import fixtures, { expectedKey, recoveryUserId, userId } from './fixtures.js';

jest.mock('api/users/generateUnlockCode.ts', () => ({
  generateUnlockCode: () => 'hash',
}));

describe('Users', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('recoverPassword', () => {
    beforeEach(() => {
      jest.restoreAllMocks();
      jest.spyOn(mailer, 'send').mockImplementation(async () => Promise.resolve('OK'));
      jest.spyOn(Date, 'now').mockReturnValue(1000);
      testingEnvironment.setFakeContext();
    });

    it('should find the matching email create a recover password doc in the database and send an email', async () => {
      const key = unlockCode.generateUnlockCode();
      const settings = await settingsModel.get();
      const response = await users.recoverPassword('test@email.com', 'domain');
      expect(response).toBe('OK');
      const recoverPasswordDb = await passwordRecoveriesModel.get({ key });
      expect(recoverPasswordDb[0].user.toString()).toBe(userId.toString());
      const emailSender = mailer.createSenderDetails(settings[0]);
      const expectedMailOptions = {
        from: emailSender,
        to: 'test@email.com',
        subject: 'Password recovery',
        text:
          'Your username is: username\n' +
          'To set your password click on the following link:\n' +
          `domain/setpassword/${key}\n` +
          'This link will be valid for 24 hours.',
      };
      expect(mailer.send).toHaveBeenCalledWith(expectedMailOptions);
    });

    it('should personalize the mail if recover password process is part of a newly created user', async () => {
      const key = unlockCode.generateUnlockCode();
      const settings = await settingsModel.get();

      const newUser = await usersModel.save({
        username: 'spidey',
        email: 'peter@parker.com',
        password: await encryptPassword('mypass'),
        role: 'editor',
      });
      const newUserId = newUser._id.toString();
      const response = await users.recoverPassword('peter@parker.com', 'http://localhost', {
        newUser: true,
      });
      expect(response).toBe('OK');
      const recoverPasswordDb = await passwordRecoveriesModel.get({ key });
      expect(recoverPasswordDb[0].user.toString()).toBe(newUserId);
      const emailSender = mailer.createSenderDetails(settings[0]);
      const expectedMailOptions = {
        from: emailSender,
        to: 'peter@parker.com',
        subject: 'Welcome to Uwazi instance',
        text: `To set your password click on the following link:\ndomain/setpassword/${key}`,
      };

      expect(mailer.send.mock.calls[0][0].from).toBe(expectedMailOptions.from);
      expect(mailer.send.mock.calls[0][0].to).toBe(expectedMailOptions.to);
      expect(mailer.send.mock.calls[0][0].subject).toBe(expectedMailOptions.subject);
      expect(mailer.send.mock.calls[0][0].text).toContain('administrators');
      expect(mailer.send.mock.calls[0][0].text).toContain('Uwazi instance');
      expect(mailer.send.mock.calls[0][0].text).toContain('spidey');
      expect(mailer.send.mock.calls[0][0].text).toContain(
        `http://localhost/setpassword/${key}?createAccount=true`
      );
      expect(mailer.send.mock.calls[0][0].html).toContain('administrators');
      expect(mailer.send.mock.calls[0][0].html).toContain('Uwazi instance');
      expect(mailer.send.mock.calls[0][0].html).toContain('<b>spidey</b></p>');
      expect(mailer.send.mock.calls[0][0].html).toContain(
        '<a href="https://www.uwazi.io">https://www.uwazi.io</a>'
      );
      expect(mailer.send.mock.calls[0][0].html).toContain(
        `<a href="http://localhost/setpassword/${key}?createAccount=true">http://localhost/setpassword/${key}?createAccount=true</a>`
      );
    });

    describe('when something fails with the mailer', () => {
      it('should reject the promise and return the error', async () => {
        jest
          .spyOn(mailer, 'send')
          .mockImplementation(() => Promise.reject(new Error('some error')));

        try {
          await users.recoverPassword('test@email.com');
          throw new Error('should throw an error');
        } catch (error) {
          expect(error.message).toBe('some error');
        }
      });
    });

    describe('when the user does not exist with that email', () => {
      it('should not create the entry in the database, should not send a mail, and return nothing', async () => {
        jest.spyOn(Date, 'now').mockReturnValue(1000);
        const key = unlockCode.generateUnlockCode();
        let response;
        response = await users.recoverPassword('false@email.com');
        expect(response).toBe(undefined);
        response = await passwordRecoveriesModel.get({ key });
        expect(response.length).toBe(0);
      });
    });

    describe('when the user is soft-deleted', () => {
      it('should return nothing', async () => {
        await usersModel.db.updateOne({ _id: userId }, { $set: { deletedAt: new Date() } });
        const response = await users.recoverPassword('test@email.com', 'domain');
        expect(response).toBe(undefined);
      });
    });
  });

  describe('resetPassword', () => {
    it('should reset the password for the user based on the provided key', async () => {
      await users.resetPassword({ key: expectedKey, password: '1234' });
      const [user] = await users.get({ _id: recoveryUserId }, '+password');
      expect(await comparePasswords('1234', user.password)).toBe(true);
    });

    it('should delete the resetPassword', async () => {
      const response = await passwordRecoveriesModel.get({ key: expectedKey });
      expect(response.length).toBe(1);
      await users.resetPassword({ key: expectedKey, password: '1234' });
      const response2 = await passwordRecoveriesModel.get({ key: expectedKey });
      expect(response2.length).toBe(0);
    });

    it('should reset the unsuccessful logins count and unlock the user', async () => {
      let [user] = await users.get({ _id: recoveryUserId });
      user.failedLogins = 6;
      user.accountLocked = true;
      user.accountUnlockCode = 'unlockCode';
      await usersModel.save(user);

      await users.resetPassword({ key: expectedKey, password: '1234' });

      [user] = await users.get(
        { _id: recoveryUserId },
        '+failedLogins +accountLocked +accountUnlockCode'
      );
      expect(user.failedLogins).toBe(undefined);
      expect(user.accountLocked).toBe(undefined);
      expect(user.accountUnlockCode).toBe(undefined);
    });

    it('should fail for a soft-deleted user', async () => {
      await usersModel.db.updateOne({ _id: recoveryUserId }, { $set: { deletedAt: new Date() } });
      const keyBefore = await passwordRecoveriesModel.get({ key: expectedKey });
      expect(keyBefore.length).toBe(1);

      try {
        await users.resetPassword({ key: expectedKey, password: '1234' });
        fail('should throw error');
      } catch (error) {
        expect(error).toEqual(createError('User not found', 404));
      }

      const keyAfter = await passwordRecoveriesModel.get({ key: expectedKey });
      expect(keyAfter.length).toBe(1);
    });
  });

  describe('getById', () => {
    it('should return the asked user without password or groups', async () => {
      const user = await users.getById(userId);
      expect(user.username).toBe('username');
      expect(user.password).toBe(undefined);
      expect(user.groups).toBe(undefined);
    });
    it('should return the asked user with groups if asked for', async () => {
      const user = await users.getById(userId, '-password', true);
      expect(user.username).toBe('username');
      expect(user.groups[0].name).toBe('Group 2');
    });

    it('should not fail if asking for groups but user does not exist', async () => {
      const user = await users.getById(db.id(), '-password', true);
      expect(user).toBe(null);
    });

    it('should return null for a deleted user', async () => {
      await usersModel.db.updateOne({ _id: userId }, { $set: { deletedAt: new Date() } });
      const user = await users.getById(userId);
      expect(user).toBeNull();
    });
  });

  describe('get', () => {
    it('should return all users without group data', async () => {
      const userList = await users.get();
      expect(userList.length).toBe(6);
      const groupData = userList.filter(u => u.groups !== undefined);
      expect(groupData.length).toBe(0);
    });

    it('should return all users with groups to which they belong', async () => {
      const userList = await users.get({}, '+groups');
      expect(userList.length).toBe(6);
      expect(userList[0].groups[0].name).toBe('Group 2');
      expect(userList[1].groups[0].name).toBe('Group 1');
    });

    it('should exclude soft-deleted users from results', async () => {
      await usersModel.db.updateOne({ _id: userId }, { $set: { deletedAt: new Date() } });
      const userList = await users.get();
      expect(userList.length).toBe(5);
      expect(userList.find(u => u._id.toString() === userId.toString())).toBeUndefined();
    });
  });
});
