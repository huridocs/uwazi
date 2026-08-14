/* eslint-disable max-statements */
import { createError } from '#api/utils/index.js';
import mailer from '#api/utils/mailer.js';
import db from '#api/utils/testing_db.js';
import { comparePasswords, encryptPassword } from '#api/auth/encryptPassword.js';
import * as usersUtils from '#api/auth2fa/usersUtils.js';
import { settingsModel } from '#api/settings/settingsModel.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import * as unlockCode from '../generateUnlockCode.js';
import passwordRecoveriesModel from '../passwordRecoveriesModel.js';
import users from '../users.js';
import usersModel from '../usersModel.js';
import fixtures, { expectedKey, recoveryUserId, userId, userToDelete } from './fixtures.js';

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

  describe('login', () => {
    let testUser;

    beforeEach(async () => {
      testUser = {
        username: 'someuser1',
        password: await encryptPassword('password'),
        email: 'someuser1@mailer.com',
        role: 'admin',
      };
      jest.spyOn(mailer, 'send').mockResolvedValue();
    });

    afterEach(() => {
      mailer.send.mockRestore();
    });

    const testLogin = async (username, password, token) =>
      users.login({ username, password, token }, 'http://host.domain');

    const createUserAndTestLogin = async (username, password, token) => {
      await usersModel.save(testUser);
      return testLogin(username, password, token);
    };

    const assessFailedLogins = async (operator, value) => {
      const [dbUser] = await usersModel.get({ username: 'someuser1' }, '+failedLogins');
      if (!value) {
        expect(dbUser.failedLogins)[operator]();
      }
      expect(dbUser.failedLogins)[operator](value);
    };

    it('should return user with matching username and password', async () => {
      const user = await createUserAndTestLogin('someuser1', 'password');
      delete user._id;
      expect(user).toMatchSnapshot();
    });

    it('should reset failedLogins counter when login is successful', async () => {
      testUser.failedLogins = 5;
      await createUserAndTestLogin('someuser1', 'password');
      await assessFailedLogins('toBeFalsy');
    });

    it('should throw error if username does not exist', async () => {
      try {
        await createUserAndTestLogin('unknownuser1', 'password');
        fail('should throw error');
      } catch (e) {
        expect(e).toEqual(createError('Invalid username or password', 401));
      }
    });

    it('should throw error if user is deleted', async () => {
      await usersModel.save({ ...testUser, deletedAt: new Date() });
      try {
        await testLogin('someuser1', 'password');
        fail('should throw error');
      } catch (e) {
        expect(e).toEqual(createError('Invalid username or password', 401));
      }
    });

    it('should throw error if password is incorrect and increment failedLogins', async () => {
      try {
        await createUserAndTestLogin('someuser1', 'incorrect');
        fail('should throw error');
      } catch (e) {
        await assessFailedLogins('toBe', 1);
      }
      try {
        await testLogin('someuser1', 'incorrect again');
        fail('should throw error');
      } catch (e) {
        await assessFailedLogins('toBe', 2);
      }
    });

    it('should lock account after sixth failed login attempt and generate unlock code', async () => {
      testUser.failedLogins = 5;
      try {
        await createUserAndTestLogin('someuser1', 'incorrect');
        fail('should throw error');
      } catch (e) {
        expect(e).toEqual(createError('Invalid username or password', 401));
        const [user] = await users.get(
          { username: 'someuser1' },
          '+accountLocked +accountUnlockCode'
        );
        expect(user.accountLocked).toBe(true);
        expect(user.accountUnlockCode).toEqual(expect.any(String));
      }
    });

    describe('after locking account', () => {
      it('should send user and email with the unlock link', async () => {
        testUser.failedLogins = 5;
        try {
          await createUserAndTestLogin('someuser1', 'incorrect');
          fail('should throw error');
        } catch (e) {
          expect(mailer.send.mock.calls[0]).toMatchSnapshot();
        }
      });

      it('should validate domain url before blocking the user', async () => {
        testUser.failedLogins = 5;
        try {
          await usersModel.save(testUser);
          await users.login(
            { username: 'someuser1', password: 'incorrect' },
            'http://host.domain\">http://host.domain</a></p><h1>injected html</h1>'
          );
          fail('should throw error');
        } catch (e) {
          expect(e.message).toBe('Invalid URL');
        }

        const dbUser = (await testingEnvironment.db.getAllFrom('users')).find(
          u => u.username === testUser.username
        );
        expect(dbUser.failedLogins).toBe(5);
      });
    });

    it('should prevent login if account is locked when credentials are correct', async () => {
      testUser.accountLocked = true;
      try {
        await createUserAndTestLogin('someuser1', 'password');
        fail('should throw error');
      } catch (e) {
        expect(e.message).toBe('Invalid username or password');
        expect(e.code).toBe(401);
      }
    });

    it('should prevent login if account is locked when credentials are not correct', async () => {
      testUser.accountLocked = true;
      try {
        await createUserAndTestLogin('someuser1', 'incorrect');
        fail('should throw error');
      } catch (e) {
        expect(e.message).toBe('Invalid username or password');
        expect(e.code).toBe(401);
      }
    });

    it('should not increment failed attempts if account is already blocked', async () => {
      testUser.accountLocked = true;
      testUser.accountUnlockCode = 'any_code';
      testUser.failedLogins = 6;

      try {
        await createUserAndTestLogin('someuser1', 'wrong_password');
        fail('should throw error');
      } catch (e) {
        expect(e.message).toBe('Invalid username or password');
        expect(e.code).toBe(401);
      }

      const [dbUser] = await usersModel.get(
        { username: 'someuser1' },
        '+password +accountLocked +failedLogins +accountUnlockCode'
      );

      expect(dbUser.accountUnlockCode).toBe('any_code');
      expect(dbUser.failedLogins).toBe(6);
      expect(mailer.send).not.toHaveBeenCalled();
    });

    it('should not try to validate 2fa if credentials are wrong', async () => {
      testUser.failedLogins = 1;
      testUser.using2fa = true;
      const verifyTokenSpy = jest
        .spyOn(usersUtils, 'verifyToken')
        .mockRejectedValue(new Error('Invalid username or password'));

      try {
        await createUserAndTestLogin('someuser1', 'wrong_password', '2fa_token');
        fail('should throw error');
      } catch (e) {
        expect(e.message).toBe('Invalid username or password');
      }

      const [dbUser] = await usersModel.get(
        { username: 'someuser1' },
        '+password +accountLocked +failedLogins +accountUnlockCode'
      );

      expect(dbUser.failedLogins).toBe(2);
      expect(mailer.send).not.toHaveBeenCalled();
      expect(verifyTokenSpy).not.toHaveBeenCalled();
    });

    describe('2fa', () => {
      beforeEach(() => {
        testUser.using2fa = true;
        testUser.failedLogins = 4;

        jest.spyOn(usersUtils, 'verifyToken').mockImplementation((_user, token) => {
          if (token === 'correctToken') {
            return Promise.resolve({ validToken: true });
          }

          return Promise.reject(createError('two-factor-failed', 401));
        });
      });

      it('should login if account requires 2fa and correct token sent', async () => {
        const user = await createUserAndTestLogin('someuser1', 'password', 'correctToken');
        delete user._id;
        expect(user).toMatchSnapshot();
        await assessFailedLogins('toBeFalsy');
      });

      it('should prevent login if account requires 2fa and no token found, not affecting failed logins', async () => {
        try {
          await createUserAndTestLogin('someuser1', 'password');
          fail('should throw error');
        } catch (e) {
          expect(e.message).toMatch(/two-step verification token required/i);
          expect(e.code).toBe(409);
          await assessFailedLogins('toBe', 4);
        }
      });

      it('should not login if account requires 2fa and incorrect token sent, incrementing the failed logins', async () => {
        try {
          await createUserAndTestLogin('someuser1', 'password', 'incorrectToken');
          fail('Should throw error');
        } catch (e) {
          expect(e.message).toBe('two-factor-failed');
          await assessFailedLogins('toBe', 5);
        }
      });
    });
  });

  describe('unlockAccount', () => {
    let testUser;
    beforeEach(async () => {
      testUser = {
        username: 'someuser1',
        password: await encryptPassword('password'),
        email: 'someuser1@mailer.com',
        role: 'admin',
        accountLocked: true,
        accountUnlockCode: 'code',
        failedLogins: 3,
      };
    });
    const testUnlock = async (username, code) => users.unlockAccount({ username, code });
    const createUserAndTestUnlock = async (username, code) => {
      await usersModel.save(testUser);
      return testUnlock(username, code);
    };
    it('should unlock account if username and code are correct', async () => {
      await createUserAndTestUnlock('someuser1', 'code');
      const [user] = await users.get(
        { username: 'someuser1' },
        '+accountLocked +accountUnlockCode +failedLogins'
      );
      expect(user.accountLocked).toBeFalsy();
      expect(user.accountLockCode).toBeFalsy();
      expect(user.failedLogins).toBeFalsy();
    });
    it('should throw error if username is incorrect', async () => {
      try {
        await createUserAndTestUnlock('unknownuser1', 'code');
        fail('should throw error');
      } catch (e) {
        expect(e).toEqual(createError('Invalid username or unlock code', 403));
        const [user] = await users.get(
          { username: 'someuser1' },
          '+accountLocked +accountUnlockCode +failedLogins'
        );
        expect(user.accountLocked).toBe(true);
        expect(user.accountUnlockCode).toBe('code');
      }
    });
    it('should throw error if code is incorrect', async () => {
      try {
        await createUserAndTestUnlock('someruser1', 'incorrect');
        fail('should throw error');
      } catch (e) {
        expect(e).toEqual(createError('Invalid username or unlock code', 403));
        const [user] = await users.get(
          { username: 'someuser1' },
          '+accountLocked +accountUnlockCode +failedLogins'
        );
        expect(user.accountLocked).toBe(true);
        expect(user.accountUnlockCode).toBe('code');
      }
    });

    it('should throw error if user is soft-deleted', async () => {
      const deletedUser = { ...testUser, deletedAt: new Date() };
      await usersModel.save(deletedUser);
      try {
        await testUnlock('someuser1', 'code');
        fail('should throw error');
      } catch (e) {
        expect(e).toEqual(createError('Invalid username or unlock code', 403));
      }
    });
  });

  describe('simpleUnlock', () => {
    it('should remove unlock related fields', async () => {
      await users.simpleUnlock(userId);
      const [user] = await db.mongodb.collection('users').find({ _id: userId }).toArray();
      expect(user.accountLocked).toBe(undefined);
      expect(user.accountUnlockCode).toBe(undefined);
      expect(user.failedLogins).toBe(undefined);
    });

    it('should keep fields intact in other users', async () => {
      await users.simpleUnlock(userId);
      const [user] = await db.mongodb.collection('users').find({ _id: userToDelete }).toArray();
      expect(user.accountLocked).toBe(false);
      expect(user.accountUnlockCode).toBe(undefined);
      expect(user.failedLogins).toBe(0);
    });
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
