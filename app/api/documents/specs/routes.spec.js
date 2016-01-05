import documents_routes from '../routes.js'
import database from '../../utils/database.js'
import fixtures from './fixtures.js'
import request from '../../../shared/JSONRequest.js'
import {db_url} from '../../config/database.js'
import instrumentRoutes from '../../utils/instrumentRoutes'


describe('documents', () => {

  let routes;

  beforeEach((done) => {
    database.reset_testing_database()
    .then(() => database.import(fixtures))
    .then(done)
    .catch(done.fail);
    routes = instrumentRoutes(documents_routes);
  });

  describe('POST', () => {

    describe('not logged in', () => {
      it('should return unauthorized error', (done) => {
        let req = {body:{title: 'Batman starts'}};
        routes.post('/api/documents', req)
        .then((response) => {
          expect(response.status).toBe(401);
          done()
        })
        .catch(done.fail);
      });
    });

    it('should create a new document with use user', (done) => {
      let req = {body:{title: 'Batman begins'}, user: {"_id":"c08ef2532f0bd008ac5174b45e033c93", "username":"admin"}};

      routes.post('/api/documents', req)
      .then((response) => {
        expect(response._id).toBeDefined();
        expect(response._rev).toBeDefined();
        expect(response.title).toBe('Batman begins');
        expect(response.user).toEqual({"_id":"c08ef2532f0bd008ac5174b45e033c93", "username":"admin"});
        done();
      })
      .catch(done.fail);
    });
  });

  describe('GET', () => {
    it('should return a list of documents', (done) => {
      routes.get('/api/documents')
      .then((response) => {
        expect(response.rows.length).toBe(2);
        done();
      })
    });
  })
});
