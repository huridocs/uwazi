import referencesRroutes from '../routes.js';
import database from '../../utils/database.js';
import fixtures from './fixtures.js';
import {db_url as dbUrl} from '../../config/database.js';
import request from '../../../shared/JSONRequest';
import instrumentRoutes from '../../utils/instrumentRoutes';

describe('references routes', () => {
  let routes;

  beforeEach((done) => {
    routes = instrumentRoutes(referencesRroutes);
    database.reset_testing_database()
    .then(() => database.import(fixtures))
    .then(done)
    .catch(done.fail);
  });

  describe('POST', () => {
    it('should save a reference', (done) => {
      let req = {body: {name: 'created_reference'}};
      let postResponse;

      routes.post('/api/references', req)
      .then((response) => {
        postResponse = response;
        return request.get(dbUrl + '/_design/references/_view/all');
      })
      .then((response) => {
        let newDoc = response.json.rows.find((template) => {
          return template.value.name === 'created_reference';
        });

        expect(newDoc.value.name).toBe('created_reference');
        expect(newDoc.value._rev).toBe(postResponse._rev);
        done();
      })
      .catch(done.fail);
    });
  });

  describe('GET', () => {
    it('should return references by sourceDocument', (done) => {
      let req = {query: {sourceDocument: 'source1'}};

      routes.get('/api/references', req)
      .then((response) => {
        let docs = response.rows;
        expect(docs.length).toBe(2);
        expect(docs[0].title).toBe('reference1');
        expect(docs[1].title).toBe('reference3');
        done();
      })
      .catch(done.fail);
    });
  });
});
