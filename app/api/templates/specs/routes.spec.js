import template_routes from '../routes.js'
import database from '../../utils/database.js'
import fixtures from './fixtures.js'
import fetch from 'isomorphic-fetch'
import {db_url} from '../../config/database.js'

describe('users routes', () => {

  let app;

  beforeEach((done) => {
    app = jasmine.createSpyObj('app', ['get', 'post']);
    database.reset_testing_database()
    .then(() => database.import(fixtures))
    .then(done)
    .catch(done.fail);
  });

  describe("GET", () => {
    it("should listen /api/templates", function () {
      template_routes(app);
      let args = app.get.calls.mostRecent().args;
      expect(args[0]).toBe('/api/templates');
    });

    it("should return all templates by default", (done) => {
      template_routes(app);
      let templates_get = app.get.calls.mostRecent().args[1];

      let res = {json: function(){}};
      let req = {};

      spyOn(res, 'json').and.callFake((response) => {
        let docs = response.rows;
        expect(docs[0].value.name).toBe('template_test');
        done();
      });

      templates_get(req, res);
    });
  });

  describe('POST', () => {
    it('should listen /api/templates', () => {
      template_routes(app);
      let args = app.post.calls.mostRecent().args;
      expect(args[0]).toBe('/api/templates');
    });

    it('should create a template', (done) => {
      template_routes(app);
      let templates_post = app.post.calls.mostRecent().args[1];

      let res = {json: function(){}};
      let req = {body:{name:'template_test',  "data":"test_data"}};

      spyOn(res, 'json').and.callFake((response) => {
        expect(response).toBe('');

        fetch(db_url+'/_design/templates/_view/all')
        .then(response => response.json())
        .then(couchdb_response => {
          let docs = couchdb_response.rows;

          expect(docs[1].value.name).toBe('template_test');
          expect(docs[1].value.data).toBe('test_data');
          done();
        })
        .catch(done.fail);

      });

      templates_post(req, res);

    });
  });
});
