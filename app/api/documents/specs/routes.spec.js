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

    it('should create a new document', (done) => {
      let req = {body:{title: 'Batman begins'}, user: {"_id":"c08ef2532f0bd008ac5174b45e033c93", "username":"admin"}};

      routes.post('/api/documents', req)
      .then((response) => {
        expect(response.ok).toBe(true);
        expect(response.id).toBeDefined();
        expect(response.rev).toBeDefined();
        return request.get(db_url+'/_design/documents/_view/all')
      })
      .then((documents) => {
        expect(documents.json.rows.find(doc => doc.title = 'Batman begins')).toBeDefined();
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
