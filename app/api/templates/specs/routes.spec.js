import template_routes from '../routes.js'
import database from '../../utils/database.js'
import fixtures from './fixtures.js'
import fetch from 'isomorphic-fetch'
import {db_url} from '../../config/database.js'
import request from '../../../shared/JSONRequest'
import instrumentRoutes from '../../utils/instrumentRoutes'

describe('templates routes', () => {

  let app;
  let routes;

  beforeEach((done) => {
    routes = instrumentRoutes(template_routes);
    app = jasmine.createSpyObj('app', ['get', 'post', 'delete']);
    database.reset_testing_database()
    .then(() => database.import(fixtures))
    .then(done)
    .catch(done.fail);
  });

  describe("GET", () => {
    it("should return all templates by default", (done) => {

      routes.get('/api/templates')
      .then((response) => {
        let docs = response.rows;
        expect(docs[0].name).toBe('template_test');
        done();
      })
      .catch(done.fail);

    });

    describe("when passing id", () => {
      it("should return matching template", (done) => {
        let request = {query:{_id:'c08ef2532f0bd008ac5174b45e033c94'}};

        routes.get('/api/templates', request)
        .then((response) => {
          let docs = response.rows;
          expect(docs[0].name).toBe('template_test2');
          done();
        })
        .catch(done.fail);

      });
    });

    describe("when there is a db error", () => {
      it("return the error in the response", (done) => {

        let request = {query:{_id:'non_existent_id'}};

        database.reset_testing_database()
        .then(() => routes.get('/api/templates', request))
        .then((response) => {
          let error = response.error;
          expect(error.error).toBe('not_found');
          done();
        })
        .catch(done.fail);

      });
    });

  });

  describe("DELETE", () => {

    it("should delete a template", (done) => {

      request.get(db_url+'/c08ef2532f0bd008ac5174b45e033c93')
      .then(template => {
        let request = {body:{"_id":template.json._id, "_rev":template.json._rev}};
        return routes.delete('/api/templates', request);
      })
      .then((response) => {
        expect(response.ok).toBe(true);
        return request.get(db_url+'/_design/templates/_view/all');
      })
      .then((response) => {
        let docs = response.json.rows;
        expect(docs.length).toBe(1);
        expect(docs[0].value.name).toBe('template_test2');
        done();
      })
      .catch(done.fail);

    });

    describe("when there is a db error", () => {
      it("return the error in the response", (done) => {
        let request = {body:{"_id":'c08ef2532f0bd008ac5174b45e033c93', "_rev":'bad_rev'}};

        routes.delete('/api/templates', request)
        .then((response) => {
          expect(response.error.error).toBe('bad_request');
          done();
        })
        .catch(done.fail);

      });
    });

  });

  describe('POST', () => {

    it('should create a template', (done) => {

      let req = {body:{name:'created_template', fields:[{label:'fieldLabel'}]}};
      let postResponse;

      routes.post('/api/templates', req)
      .then((response) => {
        postResponse = response;
        return request.get(db_url+'/_design/templates/_view/all')
      })
      .then((response) => {
        let new_doc = response.json.rows.find((template) => {
          return template.value.name == 'created_template';
        });

        expect(new_doc.value.name).toBe('created_template');
        expect(new_doc.value.fields).toEqual([{label:'fieldLabel'}]);
        expect(new_doc.value._rev).toBe(postResponse.rev);
        done();
      })
      .catch(done.fail);

    });

    it("should set a default value of [] to fields property if its missing", (done) => {
      let req = {body:{name:'created_template'}};
      let postResponse;

      routes.post('/api/templates', req)
      .then((response) => {
        postResponse = response;
        return request.get(db_url+'/_design/templates/_view/all')
      })
      .then((response) => {
        let new_doc = response.json.rows.find((template) => {
          return template.value.name == 'created_template';
        });

        expect(new_doc.value.name).toBe('created_template');
        expect(new_doc.value.properties).toEqual([]);
        expect(new_doc.value._rev).toBe(postResponse.rev);
        done();
      })
      .catch(done.fail);
    });

    describe("when passing _id and _rev", () => {
      it("edit an existing one", (done) => {

        request.get(db_url+'/c08ef2532f0bd008ac5174b45e033c94')
        .then((response) => {
          let template = response.json;
          let req = {body:{_id: template._id, _rev: template._rev, name:'changed name'}};
          return routes.post('/api/templates', req)
        })
        .then((response) => {
          return request.get(db_url+'/c08ef2532f0bd008ac5174b45e033c94')
        })
        .then((response) => {
          let template = response.json;
          expect(template.name).toBe('changed name');
          done();
        })
        .catch(done.fail)

      });
    });

    describe("when there is a db error", () => {
      it("return the error in the response", (done) => {

        let req = {body:{"_id":'c08ef2532f0bd008ac5174b45e033c93', "_rev":'bad_rev'}};

        routes.post('/api/templates', req)
        .then((response) => {
          let error = response.error;
          expect(error.error).toBe('bad_request');
          done();
        })
        .catch(done.fail);

      });
    });
  });
});
