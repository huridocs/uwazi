import referencesRroutes from '../routes.js'
import database from '../../utils/database.js'
import fixtures from './fixtures.js'
import fetch from 'isomorphic-fetch'
import {db_url} from '../../config/database.js'
import request from '../../../shared/JSONRequest'
import instrumentRoutes from '../../utils/instrumentRoutes'

describe('references routes', () => {

  let app;
  let routes;

  beforeEach((done) => {
    routes = instrumentRoutes(referencesRroutes);
    app = jasmine.createSpyObj('app', ['get', 'post', 'delete']);
    database.reset_testing_database()
    .then(() => database.import(fixtures))
    .then(done)
    .catch(done.fail);
  });

  describe('POST', () => {

    it('should save a reference', (done) => {

      let req = {body:{name:'created_reference'}};
      let postResponse;

      routes.post('/api/references', req)
      .then((response) => {
        postResponse = response;
        return request.get(db_url+'/_design/references/_view/all')
      })
      .then((response) => {
        let new_doc = response.json.rows.find((template) => {
          return template.value.name == 'created_reference';
        });

        expect(new_doc.value.name).toBe('created_reference');
        expect(new_doc.value._rev).toBe(postResponse.rev);
        done();
      })
      .catch(done.fail);

    });

  });

  describe("GET", () => {

    it("should return references by sourceDocument", (done) => {

      let request = {query:{sourceDocument:'source1'}};

      routes.get('/api/references', request)
      .then((response) => {
        let docs = response.rows;
        expect(docs.length).toBe(2);
        expect(docs[0].value.title).toBe('reference1');
        expect(docs[1].value.title).toBe('reference3');
        done();
      })
      .catch(done.fail);

    });

  });
});
