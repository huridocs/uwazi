import users from '../users.js';
import database from '../../utils/database.js';
import fixtures from './fixtures.js';
import fetch from 'isomorphic-fetch';
import {db_url as dbUrl} from '../../config/database.js';
import SHA256 from 'crypto-js/sha256';
import {catchErrors} from 'api/utils/jasmineHelpers';
import mailer from 'api/utils/mailer';

describe('Users', () => {
  beforeEach((done) => {
    database.reset_testing_database()
    .then(() => database.import(fixtures))
    .then(() => done())
    .catch(catchErrors(done));
  });

  describe('update', () => {
    it('should update user matching id and revision preserving all the other properties not sended like username', (done) => {
      fetch(dbUrl + '/c08ef2532f0bd008ac5174b45e033c93')
      .then(response => response.json())
      .then(user => {
        return users.update({_id: user._id, _rev: user._rev, password: 'new_password'});
      })
      .then(() => {
        return fetch(dbUrl + '/c08ef2532f0bd008ac5174b45e033c93');
      })
      .then(response => response.json())
      .then(user => {
        expect(user.password).toBe(SHA256('new_password').toString());
        expect(user.username).toBe('admin');
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
      let expectedKey = SHA256('admin@admin.com' + 1000).toString();
      users.recoverPassword('admin@admin.com')
      .then(() => {
        return fetch(`${dbUrl}/_design/recoverpassword/_view/all?key="${expectedKey}"`);
      })
      .then(response => response.json())
      .then(recoverPasswordDoc => {
        expect(recoverPasswordDoc.rows[0].value.user).toBe('c08ef2532f0bd008ac5174b45e033c93');
        let expectedMailOptions = {
          from: '"Uwazi" <no-reply@uwazi.com>',
          to: 'admin@admin.com',
          subject: 'Password recovery',
          text: 'To reset your password click the following link:\n' +
          'http://localhost:3000/resetpassword/ace2fe3d70340fe4bdba3b5e087b0336e37887f28ac189c8f5b7546f9c5dbdb5'
        };
        expect(mailer.send).toHaveBeenCalledWith(expectedMailOptions);
        done();
      })
      .catch(catchErrors(done));
    });

    describe('when the user does not exist with that email', () => {
      it('should do nothing', (done) => {
        spyOn(Date, 'now').and.returnValue(1000);
        let expectedKey = SHA256('false@email.com' + 1000).toString();
        users.recoverPassword('false@email.com')
        .then(() => {
          return fetch(`${dbUrl}/_design/recoverpassword/_view/all?key="${expectedKey}"`);
        })
        .then(response => response.json())
        .then(response => {
          expect(response.rows.length).toBe(0);
          done();
        })
        .catch(catchErrors(done));
      });
    });
  });

  describe('resetPassword', () => {
    it('should reset the password for the user based on the provided key', (done) => {
      users.resetPassword({key: 'ca825610a39a1cb5703d583c141485c7557b7f2dc135f68ea38122f9b3e3776d', password: '1234'})
      .then(() => {
        return fetch(dbUrl + '/c08ef2532f0bd008ac5174b45e033c93');
      })
      .then(response => response.json())
      .then(user => {
        expect(user.password).toBe(SHA256('1234').toString());
        done();
      })
      .catch(catchErrors(done));
    });

    it('should delete the resetPassword doc', (done) => {
      users.resetPassword({key: 'ca825610a39a1cb5703d583c141485c7557b7f2dc135f68ea38122f9b3e3776d', password: '1234'})
      .then(() => {
        return fetch(dbUrl + '/f01c8ec398e61b9390efbfc363386417');
      })
      .then(response => response.json())
      .then(response => {
        expect(response.error).toBe('not_found');
        expect(response.reason).toBe('deleted');
        done();
      })
      .catch(catchErrors(done));
    });
  });
});
