import users from '../users.js';
import SHA256 from 'crypto-js/sha256';
import {catchErrors} from 'api/utils/jasmineHelpers';
import mailer from 'api/utils/mailer';

import fixtures, {userId, expectedKey, recoveryUserId} from './fixtures.js';
import db from 'api/utils/testing_db';
import {createError} from 'api/utils';
import passwordRecoveriesModel from '../passwordRecoveriesModel';

describe('Users', () => {
  beforeEach((done) => {
    db.clearAllAndLoad(fixtures).then(done).catch(catchErrors(done));
  });

  describe('save', () => {
    let currentUser = {_id: userId};

    it('should save user matching id', (done) => {
      return users.save({_id: userId.toString(), password: 'new_password'}, currentUser)
      .then(() => users.get({_id: userId}, '+password'))
      .then(([user]) => {
        expect(user.password).toBe(SHA256('new_password').toString());
        expect(user.username).toBe('username');
        done();
      })
      .catch(catchErrors(done));
    });

    describe('when you try to change role', () => {
      it('should be an admin', (done) => {
        currentUser = {_id: userId, role: 'editor'};
        let user = {_id: recoveryUserId, role: 'admin'};
        return users.save(user, currentUser)
        .then(() => {
          done.fail('should throw an error');
        })
        .catch((error) => {
          expect(error).toEqual(createError('Unauthorized', 403));
          done();
        })
        .catch(catchErrors(done));
      });

      it('should not modify yourself', (done) => {
        currentUser = {_id: userId, role: 'admin'};
        let user = {_id: userId.toString(), role: 'editor'};
        return users.save(user, currentUser)
        .then(() => {
          done.fail('should throw an error');
        })
        .catch((error) => {
          expect(error).toEqual(createError('Can not change your own role', 403));
          done();
        })
        .catch(catchErrors(done));
      });
    });

    describe('newUser', () => {
      const domain = 'http://localhost';

      beforeEach(() => {
        spyOn(users, 'recoverPassword').and.returnValue(Promise.resolve());
      });

      it('should do the recover password process (as a new user)', (done) => {
        return users.newUser({username: 'spidey', email: 'peter@parker.com', role: 'editor'}, domain)
        .then(() => users.get({username: 'spidey'}))
        .then(([user]) => {
          expect(user.username).toBe('spidey');
          expect(users.recoverPassword).toHaveBeenCalledWith('peter@parker.com', domain, {newUser: true});
          done();
        })
        .catch(catchErrors(done));
      });

      it('should not allow repeat username', (done) => {
        return users.newUser({username: 'username', email: 'peter@parker.com', role: 'editor'}, currentUser, domain)
        .then(() => {
          done.fail('should throw an error');
        })
        .catch((error) => {
          expect(error).toEqual(createError('Username already exists', 409));
          done();
        })
        .catch(catchErrors(done));
      });

      it('should not allow repeat email', (done) => {
        return users.newUser({username: 'spidey', email: 'test@email.com', role: 'editor'}, currentUser, domain)
        .then(() => {
          done.fail('should throw an error');
        })
        .catch((error) => {
          expect(error).toEqual(createError('Email already exists', 409));
          done();
        })
        .catch(catchErrors(done));
      });
    });

    describe('different user', () => {
      it('cant change the password', (done) => {
        currentUser = {_id: 'the_hacker'};
        return users.save({_id: userId.toString(), password: 'new_password', role: 'editor'}, currentUser)
        .then(() => {
          done.fail('should throw an error');
        })
        .catch((error) => {
          expect(error).toEqual(createError('Can not change other user password', 403));
          return users.get({_id: userId}, '+password');
        })
        .then(([user]) => {
          expect(user.password).toBe('password');
          done();
        })
        .catch(catchErrors(done));
      });
    });
  });

  describe('recoverPassword', () => {
    it('should find the matching email create a recover password doc in the database and send an email', (done) => {
      spyOn(mailer, 'send').and.returnValue(Promise.resolve('OK'));
      spyOn(Date, 'now').and.returnValue(1000);
      const key = SHA256('test@email.com' + 1000).toString();
      users.recoverPassword('test@email.com', 'domain')
      .then(response => {
        expect(response).toBe('OK');
        return passwordRecoveriesModel.get({key});
      })
      .then(recoverPasswordDb => {
        expect(recoverPasswordDb[0].user.toString()).toBe(userId.toString());
        let expectedMailOptions = {
          from: '"Uwazi" <no-reply@uwazi.io>',
          to: 'test@email.com',
          subject: 'Password set',
          text: 'To set your password click on the following link:\n' +
          `domain/setpassword/${key}`
        };
        expect(mailer.send).toHaveBeenCalledWith(expectedMailOptions);
        done();
      })
      .catch(catchErrors(done));
    });

    it('should personalize the mail if recover password process is part of a newly created user', (done) => {
      spyOn(mailer, 'send').and.returnValue(Promise.resolve('OK'));
      spyOn(Date, 'now').and.returnValue(1000);

      const key = SHA256('peter@parker.com' + 1000).toString();
      let newUserId;

      users.newUser({username: 'spidey', email: 'peter@parker.com', role: 'editor'}, 'http://localhost')
      .then(newUser => {
        newUserId = newUser._id.toString();
        return users.recoverPassword('peter@parker.com', 'http://localhost', {newUser: true});
      })
      .then(response => {
        expect(response).toBe('OK');
        return passwordRecoveriesModel.get({key});
      })
      .then(recoverPasswordDb => {
        expect(recoverPasswordDb[0].user.toString()).toBe(newUserId);
        let expectedMailOptions = {
          from: '"Uwazi" <no-reply@uwazi.io>',
          to: 'peter@parker.com',
          subject: 'Welcome to Uwazi instance',
          text: 'To set your password click on the following link:\n' +
          `domain/setpassword/${key}`
        };
        expect(mailer.send.calls.mostRecent().args[0].from).toBe(expectedMailOptions.from);
        expect(mailer.send.calls.mostRecent().args[0].to).toBe(expectedMailOptions.to);
        expect(mailer.send.calls.mostRecent().args[0].subject).toBe(expectedMailOptions.subject);

        expect(mailer.send.calls.mostRecent().args[0].text).toContain('administrators');
        expect(mailer.send.calls.mostRecent().args[0].text).toContain('Uwazi instance');
        expect(mailer.send.calls.mostRecent().args[0].text).toContain('spidey');
        expect(mailer.send.calls.mostRecent().args[0].text).toContain(`http://localhost/setpassword/${key}?createAccount=true`);

        expect(mailer.send.calls.mostRecent().args[0].html).toContain('administrators');
        expect(mailer.send.calls.mostRecent().args[0].html).toContain('Uwazi instance');
        expect(mailer.send.calls.mostRecent().args[0].html).toContain('<b>spidey</b></p>');
        expect(mailer.send.calls.mostRecent().args[0].html).toContain('<a href="https://www.uwazi.io">https://www.uwazi.io</a>');

        expect(mailer.send.calls.mostRecent().args[0].html)
        .toContain(`<a href="http://localhost/setpassword/${key}?createAccount=true">http://localhost/setpassword/${key}?createAccount=true</a>`);
        done();
      })
      .catch(catchErrors(done));
    });

    describe('when something fails with the mailer', () => {
      it('should reject the promise and return the error', (done) => {
        spyOn(mailer, 'send').and.callFake(() => Promise.reject({Error: 'some error'}));

        users.recoverPassword('test@email.com')
        .then(() => {
          done.fail('should not have resolved');
        })
        .catch(error => {
          expect(error.Error).toBe('some error');
          done();
        });
      });
    });

    describe('when the user does not exist with that email', () => {
      it('should not create the entry in the database, should not send a mail, and return "userNotFound".', (done) => {
        spyOn(Date, 'now').and.returnValue(1000);
        let key = SHA256('false@email.com' + 1000).toString();
        users.recoverPassword('false@email.com')
        .then(response => {
          expect(response).toBe('userNotFound');
          return passwordRecoveriesModel.get({key});
        })
        .then(response => {
          expect(response.length).toBe(0);
          done();
        })
        .catch(catchErrors(done));
      });
    });
  });

  describe('resetPassword', () => {
    it('should reset the password for the user based on the provided key', (done) => {
      users.resetPassword({key: expectedKey, password: '1234'})
      .then(() => users.get({_id: recoveryUserId}, '+password'))
      .then(([user]) => {
        expect(user.password).toBe(SHA256('1234').toString());
        done();
      })
      .catch(catchErrors(done));
    });

    it('should delete the resetPassword', (done) => {
      passwordRecoveriesModel.get({key: expectedKey})
      .then(response => {
        expect(response.length).toBe(1);
        return users.resetPassword({key: expectedKey, password: '1234'});
      })
      .then(() => passwordRecoveriesModel.get({key: expectedKey}))
      .then(response => {
        expect(response.length).toBe(0);
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('delete()', () => {
    it('should delete the user', (done) => {
      users.delete(userId, {_id: 'another_user'})
      .then(() => users.getById(userId))
      .then((user) => {
        expect(user).toBe(null);
        done();
      });
    });

    it('should not allow to delete self', (done) => {
      users.delete(userId.toString(), {_id: userId})
      .then(() => {
        done.fail('should throw an error');
      })
      .catch((error) => {
        expect(error).toEqual(createError('Can not delete yourself', 403));
        return users.getById(userId);
      })
      .then((user) => {
        expect(user).not.toBe(null);
        done();
      });
    });

    it('should not allow to delete the last user', (done) => {
      users.delete(recoveryUserId.toString(), {_id: 'someone'})
      .then(() => users.delete(userId.toString(), {_id: 'someone'}))
      .then(() => {
        done.fail('should throw an error');
      })
      .catch((error) => {
        expect(error).toEqual(createError('Can not delete last user', 403));
        return users.getById(userId);
      })
      .then((user) => {
        expect(user).not.toBe(null);
        done();
      });
    });
  });
});
