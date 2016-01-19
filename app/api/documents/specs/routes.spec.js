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
        expect(response.id).toBeDefined();
        expect(response.value.title).toBe('Batman begins');
        expect(response.value.user).toEqual({"_id":"c08ef2532f0bd008ac5174b45e033c93", "username":"admin"});
        done();
      })
      .catch(done.fail);
    });
  });

  describe('GET', () => {
    it('should return a list of documents returned from the list view', (done) => {
      routes.get('/api/documents')
      .then((response) => {
        expect(response.rows.length).toBe(2);
        expect(response.rows[0].value).toEqual({title:'Batman finishes', _id: '8202c463d6158af8065022d9b5014a18'});
        done();
      })
    });

    describe("when passing id", () => {
      it('should return matching document', (done) => {
        let request = {query:{_id:'8202c463d6158af8065022d9b5014ccb'}};

        routes.get('/api/documents', request)
        .then((response) => {
          let docs = response.rows;
          expect(docs.length).toBe(1);
          expect(docs[0].value.title).toBe('Penguin almost done');
          done();
        })
        .catch(done.fail);

      });
    });

  })
});
