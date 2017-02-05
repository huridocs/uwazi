import users from 'app/Users/UsersAPI';
import {APIURL} from 'app/config.js';
import backend from 'fetch-mock';
import {catchErrors} from 'api/utils/jasmineHelpers';

describe('UsersAPI', () => {
  beforeEach(() => {
    backend.restore();
    backend
    .post(APIURL + 'users', {body: JSON.stringify('ok')})
    .get(APIURL + 'user', {body: JSON.stringify({name: 'doe'})});
  });

  afterEach(() => backend.restore());

  describe('save()', () => {
    let user;

    beforeEach(() => {
      user = {
        name: 'doe',
        _id: '123'
      };
    });

    it('should post to users', (done) => {
      users.save(user)
      .then((response) => {
        expect(response).toEqual('ok');
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('currentUser()', () => {
    it('should request the logged in user', (done) => {
      users.currentUser()
      .then((response) => {
        expect(response).toEqual({name: 'doe'});
        done();
      })
      .catch(catchErrors(done));
    });
  });
});
