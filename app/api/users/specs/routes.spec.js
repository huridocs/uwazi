import routes from '../routes.js';
import database from '../../utils/database.js';
import fixtures from './fixtures.js';
import fetch from 'isomorphic-fetch';
import {db_url as dbUrl} from '../../config/database.js';
import SHA256 from 'crypto-js/sha256';

describe('users routes', () => {
  beforeEach((done) => {
    database.reset_testing_database()
    .then(() => database.import(fixtures))
    .then(() => done())
    .catch(done.fail);
  });

  describe('POST', () => {
    it('should listen /api/users', () => {
      let app = jasmine.createSpyObj('app', ['post']);
      routes(app);
      let args = app.post.calls.mostRecent().args;
      expect(args[0]).toBe('/api/users');
    });

    it('should update user matching id and revision preserving all the other properties not sended like username', (done) => {
      let app = jasmine.createSpyObj('app', ['post']);
      routes(app);
      let post = app.post.calls.mostRecent().args[2];

      let res = {json: () => {}};

      fetch(dbUrl + '/c08ef2532f0bd008ac5174b45e033c93')
      .then(response => response.json())
      .then(user => {
        let req = {body: {_id: user._id, _rev: user._rev, password: 'new_password'}};
        post(req, res);
      });

      spyOn(res, 'json').and.callFake((result) => {
        expect(result).toBe('ok');

        fetch(dbUrl + '/c08ef2532f0bd008ac5174b45e033c93')
        .then(response => response.json())
        .then(user => {
          expect(user.password).toBe(SHA256('new_password').toString());
          expect(user.username).toBe('admin');
          done();
        });
      });
    });
  });
});
