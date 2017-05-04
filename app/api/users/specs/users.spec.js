import users from '../users.js';
import SHA256 from 'crypto-js/sha256';
import {catchErrors} from 'api/utils/jasmineHelpers';
import mailer from 'api/utils/mailer';

import fixtures, {userId, expectedKey, recoveryUserId} from './fixtures.js';
import {db} from 'api/utils';
import passwordRecoveriesModel from '../passwordRecoveriesModel';

describe('Users', () => {
  beforeEach((done) => {
    db.clearAllAndLoad(fixtures, (err) => {
      if (err) {
        done.fail(err);
      }
      done();
    });
  });

  describe('update', () => {
    it('should update user matching id', (done) => {
      return users.update({_id: userId, password: 'new_password'})
      .then(() => users.get({_id: userId}, '+password'))
      .then(([user]) => {
        expect(user.password).toBe(SHA256('new_password').toString());
        expect(user.username).toBe('username');
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('recoverPassword', () => {
    beforeEach(() => {
      spyOn(mailer, 'send');
    });

    it('should find the matching email create a recover password doc in the database and send an email', (done) => {
      spyOn(Date, 'now').and.returnValue(1000);
      const key = SHA256('test@email.com' + 1000).toString();
      users.recoverPassword('test@email.com', 'domain')
      .then(() => {
        return passwordRecoveriesModel.get({key});
      })
      .then(recoverPasswordDoc => {
        expect(recoverPasswordDoc[0].user.toString()).toBe(userId.toString());
        let expectedMailOptions = {
          from: '"Uwazi" <no-reply@uwazi.com>',
          to: 'test@email.com',
          subject: 'Password recovery',
          text: 'To reset your password click the following link:\n' +
          `domain/resetpassword/${key}`
        };
        expect(mailer.send).toHaveBeenCalledWith(expectedMailOptions);
        done();
      })
      .catch(catchErrors(done));
    });

    describe('when the user does not exist with that email', () => {
      it('should do nothing', (done) => {
        spyOn(Date, 'now').and.returnValue(1000);
        let key = SHA256('false@email.com' + 1000).toString();
        users.recoverPassword('false@email.com')
        .then(() => {
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
      users.resetPassword({key: expectedKey, password: '1234'})
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
      users.delete(userId)
      .then(() => users.getById(userId))
      .then((user) => {
        expect(user).toBe(null);
        done();
      });
    });
  });
});
