"use strict";var _utils = require("../../utils");
var _sha = _interopRequireDefault(require("crypto-js/sha256"));
var _crypto = _interopRequireDefault(require("crypto"));
var _jasmineHelpers = require("../../utils/jasmineHelpers");
var _mailer = _interopRequireDefault(require("../../utils/mailer"));
var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));

var _encryptPassword = _interopRequireWildcard(require("../../auth/encryptPassword"));
var _fixtures = _interopRequireWildcard(require("./fixtures.js"));
var _users = _interopRequireDefault(require("../users.js"));
var _passwordRecoveriesModel = _interopRequireDefault(require("../passwordRecoveriesModel"));
var _usersModel = _interopRequireDefault(require("../usersModel.js"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('Users', () => {
  beforeEach(done => {
    _testing_db.default.clearAllAndLoad(_fixtures.default).then(done).catch((0, _jasmineHelpers.catchErrors)(done));
  });

  afterAll(done => {
    _testing_db.default.disconnect().then(done);
  });

  describe('save', () => {
    let currentUser = { _id: _fixtures.userId };

    it('should save user matching id', done => _users.default.save({ _id: _fixtures.userId.toString(), password: 'new_password' }, currentUser).
    then(() => _users.default.get({ _id: _fixtures.userId }, '+password')).
    then(async ([user]) => {
      expect((await (0, _encryptPassword.comparePasswords)('new_password', user.password))).toBe(true);
      expect(user.username).toBe('username');
      done();
    }).
    catch((0, _jasmineHelpers.catchErrors)(done)));

    it('should not save a null password on update', async () => {
      const user = { _id: _fixtures.recoveryUserId, role: 'admin' };

      const [userInDb] = await _users.default.get(_fixtures.recoveryUserId, '+password');
      await _users.default.save(user, { _id: _fixtures.userId, role: 'admin' });
      const [updatedUser] = await _users.default.get(_fixtures.recoveryUserId, '+password');

      expect(updatedUser.password.toString()).toBe(userInDb.password.toString());
    });

    describe('when you try to change role', () => {
      it('should be an admin', done => {
        currentUser = { _id: _fixtures.userId, role: 'editor' };
        const user = { _id: _fixtures.recoveryUserId, role: 'admin' };
        return _users.default.save(user, currentUser).
        then(() => {
          done.fail('should throw an error');
        }).
        catch(error => {
          expect(error).toEqual((0, _utils.createError)('Unauthorized', 403));
          done();
        }).
        catch((0, _jasmineHelpers.catchErrors)(done));
      });

      it('should not modify yourself', done => {
        currentUser = { _id: _fixtures.userId, role: 'admin' };
        const user = { _id: _fixtures.userId.toString(), role: 'editor' };
        return _users.default.save(user, currentUser).
        then(() => {
          done.fail('should throw an error');
        }).
        catch(error => {
          expect(error).toEqual((0, _utils.createError)('Can not change your own role', 403));
          done();
        }).
        catch((0, _jasmineHelpers.catchErrors)(done));
      });
    });

    describe('newUser', () => {
      const domain = 'http://localhost';

      beforeEach(() => {
        spyOn(_users.default, 'recoverPassword').and.returnValue(Promise.resolve());
      });

      it('should do the recover password process (as a new user)', done => {
        _users.default.newUser({ username: 'spidey', email: 'peter@parker.com', role: 'editor' }, domain).
        then(() => _users.default.get({ username: 'spidey' })).
        then(([user]) => {
          expect(user.username).toBe('spidey');
          expect(_users.default.recoverPassword).toHaveBeenCalledWith('peter@parker.com', domain, { newUser: true });
          done();
        }).
        catch((0, _jasmineHelpers.catchErrors)(done));
      });

      it('should not allow repeat username', done => {
        _users.default.newUser({ username: 'username', email: 'peter@parker.com', role: 'editor' }, currentUser, domain).
        then(() => {
          done.fail('should throw an error');
        }).
        catch(error => {
          expect(error).toEqual((0, _utils.createError)('Username already exists', 409));
          done();
        });
      });

      it('should not allow repeat email', done => {
        _users.default.newUser({ username: 'spidey', email: 'test@email.com', role: 'editor' }, currentUser, domain).
        then(() => {
          done.fail('should throw an error');
        }).
        catch(error => {
          expect(error).toEqual((0, _utils.createError)('Email already exists', 409));
          done();
        });
      });
    });
  });

  describe('login', () => {
    let testUser;
    const codeBuffer = Buffer.from('code');
    beforeEach(async () => {
      testUser = {
        username: 'someuser1',
        password: await (0, _encryptPassword.default)('password'),
        email: 'someuser1@mailer.com',
        role: 'admin' };

      jest.spyOn(_crypto.default, 'randomBytes').mockReturnValue(codeBuffer);
      jest.spyOn(_mailer.default, 'send').mockResolvedValue();
    });
    afterEach(() => {
      _crypto.default.randomBytes.mockRestore();
      _mailer.default.send.mockRestore();
    });
    const testLogin = async (username, password) => _users.default.login({ username, password }, 'http://host.domain');
    const createUserAndTestLogin = async (username, password) => {
      await _usersModel.default.save(testUser);
      return testLogin(username, password);
    };
    it('should return user with matching username and password', async () => {
      const user = await createUserAndTestLogin('someuser1', 'password');
      delete user._id;
      expect(user).toMatchSnapshot();
    });
    it('should reset failedLogins counter when login is successful', async () => {
      testUser.failedLogins = 5;
      await createUserAndTestLogin('someuser1', 'password');
      const [user] = await _users.default.get({ username: 'someuser1' }, '+failedLogins');
      expect(user.failedLogins).toBeFalsy();
    });
    it('should throw error if username does not exist', async () => {
      try {
        await createUserAndTestLogin('unknownuser1', 'password');
        fail('should throw error');
      } catch (e) {
        expect(e).toEqual((0, _utils.createError)('Invalid username or password', 401));
      }
    });
    it('should throw error if password is incorrect and increment failedLogins', async () => {
      try {
        await createUserAndTestLogin('someuser1', 'incorrect');
        fail('should throw error');
      } catch (e) {
        const [user] = await _users.default.get({ username: 'someuser1' }, '+failedLogins');
        expect(user.failedLogins).toEqual(1);
      }
      try {
        await testLogin('someuser1', 'incorrect again');
        fail('should throw error');
      } catch (e) {
        const [user] = await _users.default.get({ username: 'someuser1' }, '+failedLogins');
        expect(user.failedLogins).toEqual(2);
      }
    });
    it('should lock account after sixth failed login attempt and generate unlock code', async () => {
      testUser.failedLogins = 5;
      try {
        await createUserAndTestLogin('someuser1', 'incorrect');
        fail('should throw error');
      } catch (e) {
        expect(e).toEqual((0, _utils.createError)('Account locked. Check your email to unlock.', 403));
        const [user] = await _users.default.get({ username: 'someuser1' }, '+failedLogins +accountLocked +accountUnlockCode');
        expect(user.accountLocked).toBe(true);
        expect(user.accountUnlockCode).toBe(codeBuffer.toString('hex'));
        expect(_crypto.default.randomBytes).toHaveBeenCalledWith(32);
      }
    });
    it('after locking account, it should send user and email with the unlock link', async () => {
      testUser.failedLogins = 5;
      try {
        await createUserAndTestLogin('someuser1', 'incorrect');
        fail('should throw error');
      } catch (e) {
        // const [user] = await users.get({ username: 'someuser1' }, '+failedLogins +accountLocked +accountUnlockCode');
        expect(_mailer.default.send.mock.calls[0]).toMatchSnapshot();
      }
    });
    it('should prevent login if account is locked when credentials are correct', async () => {
      testUser.accountLocked = true;
      try {
        await createUserAndTestLogin('someuser1', 'password');
        fail('should throw error');
      } catch (e) {
        expect(e.message).toMatch(/account locked/i);
        expect(e.code).toBe(403);
      }
    });
    it('should prevent login if account is locked when credentials are not correct', async () => {
      testUser.accountLocked = true;
      try {
        await createUserAndTestLogin('someuser1', 'incorrect');
        fail('should throw error');
      } catch (e) {
        expect(e.message).toMatch(/account locked/i);
        expect(e.code).toBe(403);
      }
    });
  });
  describe('unlockAccount', () => {
    let testUser;
    beforeEach(async () => {
      testUser = {
        username: 'someuser1',
        password: await (0, _encryptPassword.default)('password'),
        email: 'someuser1@mailer.com',
        role: 'admin',
        accountLocked: true,
        accountUnlockCode: 'code',
        failedLogins: 3 };

    });
    const testUnlock = async (username, code) => _users.default.unlockAccount({ username, code });
    const createUserAndTestUnlock = async (username, code) => {
      await _usersModel.default.save(testUser);
      return testUnlock(username, code);
    };
    it('should unlock account if username and code are correct', async () => {
      await createUserAndTestUnlock('someuser1', 'code');
      const [user] = await _users.default.get({ username: 'someuser1' }, '+accountLocked +accountUnlockCode +failedLogins');
      expect(user.accountLocked).toBeFalsy();
      expect(user.accountLockCode).toBeFalsy();
      expect(user.failedLogins).toBeFalsy();
    });
    it('should throw error if username is incorrect', async () => {
      try {
        await createUserAndTestUnlock('unknownuser1', 'code');
        fail('should throw error');
      } catch (e) {
        expect(e).toEqual((0, _utils.createError)('Invalid username or unlock code', 403));
        const [user] = await _users.default.get({ username: 'someuser1' }, '+accountLocked +accountUnlockCode +failedLogins');
        expect(user.accountLocked).toBe(true);
        expect(user.accountUnlockCode).toBe('code');
      }
    });
    it('should throw error if code is incorrect', async () => {
      try {
        await createUserAndTestUnlock('someruser1', 'incorrect');
        fail('should throw error');
      } catch (e) {
        expect(e).toEqual((0, _utils.createError)('Invalid username or unlock code', 403));
        const [user] = await _users.default.get({ username: 'someuser1' }, '+accountLocked +accountUnlockCode +failedLogins');
        expect(user.accountLocked).toBe(true);
        expect(user.accountUnlockCode).toBe('code');
      }
    });
  });

  describe('recoverPassword', () => {
    it('should find the matching email create a recover password doc in the database and send an email', done => {
      spyOn(_mailer.default, 'send').and.returnValue(Promise.resolve('OK'));
      spyOn(Date, 'now').and.returnValue(1000);
      const key = (0, _sha.default)(`test@email.com${1000}`).toString();
      _users.default.recoverPassword('test@email.com', 'domain').
      then(response => {
        expect(response).toBe('OK');
        return _passwordRecoveriesModel.default.get({ key });
      }).
      then(recoverPasswordDb => {
        expect(recoverPasswordDb[0].user.toString()).toBe(_fixtures.userId.toString());
        const expectedMailOptions = {
          from: '"Uwazi" <no-reply@uwazi.io>',
          to: 'test@email.com',
          subject: 'Password set',
          text: 'To set your password click on the following link:\n' +
          `domain/setpassword/${key}` };

        expect(_mailer.default.send).toHaveBeenCalledWith(expectedMailOptions);
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });

    it('should personalize the mail if recover password process is part of a newly created user', done => {
      spyOn(_mailer.default, 'send').and.returnValue(Promise.resolve('OK'));
      spyOn(Date, 'now').and.returnValue(1000);

      const key = (0, _sha.default)(`peter@parker.com${1000}`).toString();
      let newUserId;

      _users.default.newUser({ username: 'spidey', email: 'peter@parker.com', role: 'editor' }, 'http://localhost').
      then(newUser => {
        newUserId = newUser._id.toString();
        return _users.default.recoverPassword('peter@parker.com', 'http://localhost', { newUser: true });
      }).
      then(response => {
        expect(response).toBe('OK');
        return _passwordRecoveriesModel.default.get({ key });
      }).
      then(recoverPasswordDb => {
        expect(recoverPasswordDb[0].user.toString()).toBe(newUserId);
        const expectedMailOptions = {
          from: '"Uwazi" <no-reply@uwazi.io>',
          to: 'peter@parker.com',
          subject: 'Welcome to Uwazi instance',
          text: 'To set your password click on the following link:\n' +
          `domain/setpassword/${key}` };

        expect(_mailer.default.send.calls.mostRecent().args[0].from).toBe(expectedMailOptions.from);
        expect(_mailer.default.send.calls.mostRecent().args[0].to).toBe(expectedMailOptions.to);
        expect(_mailer.default.send.calls.mostRecent().args[0].subject).toBe(expectedMailOptions.subject);

        expect(_mailer.default.send.calls.mostRecent().args[0].text).toContain('administrators');
        expect(_mailer.default.send.calls.mostRecent().args[0].text).toContain('Uwazi instance');
        expect(_mailer.default.send.calls.mostRecent().args[0].text).toContain('spidey');
        expect(_mailer.default.send.calls.mostRecent().args[0].text).toContain(`http://localhost/setpassword/${key}?createAccount=true`);

        expect(_mailer.default.send.calls.mostRecent().args[0].html).toContain('administrators');
        expect(_mailer.default.send.calls.mostRecent().args[0].html).toContain('Uwazi instance');
        expect(_mailer.default.send.calls.mostRecent().args[0].html).toContain('<b>spidey</b></p>');
        expect(_mailer.default.send.calls.mostRecent().args[0].html).toContain('<a href="https://www.uwazi.io">https://www.uwazi.io</a>');

        expect(_mailer.default.send.calls.mostRecent().args[0].html).
        toContain(`<a href="http://localhost/setpassword/${key}?createAccount=true">http://localhost/setpassword/${key}?createAccount=true</a>`);
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });

    describe('when something fails with the mailer', () => {
      it('should reject the promise and return the error', done => {
        spyOn(_mailer.default, 'send').and.callFake(() => Promise.reject(new Error('some error')));

        _users.default.recoverPassword('test@email.com').
        then(() => {
          done.fail('should not have resolved');
        }).
        catch(error => {
          expect(error.message).toBe('some error');
          done();
        });
      });
    });

    describe('when the user does not exist with that email', () => {
      it('should not create the entry in the database, should not send a mail, and return an error.', done => {
        spyOn(Date, 'now').and.returnValue(1000);
        const key = (0, _sha.default)(`false@email.com${1000}`).toString();
        _users.default.recoverPassword('false@email.com').
        catch(error => {
          expect(error.code).toBe(403);
          return _passwordRecoveriesModel.default.get({ key });
        }).
        then(response => {
          expect(response.length).toBe(0);
          done();
        }).
        catch((0, _jasmineHelpers.catchErrors)(done));
      });
    });
  });

  describe('resetPassword', () => {
    it('should reset the password for the user based on the provided key', done => {
      _users.default.resetPassword({ key: _fixtures.expectedKey, password: '1234' }).
      then(() => _users.default.get({ _id: _fixtures.recoveryUserId }, '+password')).
      then(async ([user]) => {
        expect((await (0, _encryptPassword.comparePasswords)('1234', user.password))).toBe(true);
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });

    it('should delete the resetPassword', done => {
      _passwordRecoveriesModel.default.get({ key: _fixtures.expectedKey }).
      then(response => {
        expect(response.length).toBe(1);
        return _users.default.resetPassword({ key: _fixtures.expectedKey, password: '1234' });
      }).
      then(() => _passwordRecoveriesModel.default.get({ key: _fixtures.expectedKey })).
      then(response => {
        expect(response.length).toBe(0);
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });
  });

  describe('delete()', () => {
    it('should delete the user', done => {
      _users.default.delete(_fixtures.userId, { _id: 'another_user' }).
      then(() => _users.default.getById(_fixtures.userId)).
      then(user => {
        expect(user).toBe(null);
        done();
      });
    });

    it('should not allow to delete self', done => {
      _users.default.delete(_fixtures.userId.toString(), { _id: _fixtures.userId }).
      then(() => {
        done.fail('should throw an error');
      }).
      catch(error => {
        expect(error).toEqual((0, _utils.createError)('Can not delete yourself', 403));
        return _users.default.getById(_fixtures.userId);
      }).
      then(user => {
        expect(user).not.toBe(null);
        done();
      });
    });

    it('should not allow to delete the last user', done => {
      _users.default.delete(_fixtures.recoveryUserId.toString(), { _id: 'someone' }).
      then(() => _users.default.delete(_fixtures.userId.toString(), { _id: 'someone' })).
      then(() => {
        done.fail('should throw an error');
      }).
      catch(error => {
        expect(error).toEqual((0, _utils.createError)('Can not delete last user', 403));
        return _users.default.getById(_fixtures.userId);
      }).
      then(user => {
        expect(user).not.toBe(null);
        done();
      });
    });
  });
});