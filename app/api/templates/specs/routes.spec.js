import {db_url as dbURL} from 'api/config/database.js';
import templateRoutes from 'api/templates/routes.js';
import database from 'api/utils/database.js';
import fixtures from './fixtures.js';
import request from 'shared/JSONRequest';
import instrumentRoutes from 'api/utils/instrumentRoutes';

describe('templates routes', () => {
  let routes;

  beforeEach((done) => {
    routes = instrumentRoutes(templateRoutes);
    database.reset_testing_database()
    .then(() => database.import(fixtures))
    .then(done)
    .catch(done.fail);
  });

  describe('GET', () => {
    it('should return all templates by default', (done) => {
      routes.get('/api/templates')
      .then((response) => {
        let docs = response.rows;
        expect(docs[0].name).toBe('template_test');
        done();
      })
      .catch(done.fail);
    });

    describe('when passing id', () => {
      it('should return matching template', (done) => {
        let req = {query: {_id: 'c08ef2532f0bd008ac5174b45e033c94'}};

        routes.get('/api/templates', req)
        .then((response) => {
          let docs = response.rows;
          expect(docs[0].name).toBe('template_test2');
          done();
        })
        .catch(done.fail);
      });
    });

    describe('when there is a db error', () => {
      it('return the error in the response', (done) => {
        let req = {query: {_id: 'non_existent_id'}};

        database.reset_testing_database()
        .then(() => routes.get('/api/templates', req))
        .then((response) => {
          let error = response.error;
          expect(error.error).toBe('not_found');
          done();
        })
        .catch(done.fail);
      });
    });
  });

  describe('DELETE', () => {
    it('should delete a template', (done) => {
      request.get(dbURL + '/c08ef2532f0bd008ac5174b45e033c93')
      .then(template => {
        let req = {body: {_id: template.json._id, _rev: template.json._rev}};
        return routes.delete('/api/templates', req);
      })
      .then((response) => {
        expect(response.ok).toBe(true);
        return request.get(dbURL + '/_design/templates/_view/all');
      })
      .then((response) => {
        let docs = response.json.rows;
        expect(docs.length).toBe(1);
        expect(docs[0].value.name).toBe('template_test2');
        done();
      })
      .catch(done.fail);
    });

    describe('when there is a db error', () => {
      it('return the error in the response', (done) => {
        let req = {body: {_id: 'c08ef2532f0bd008ac5174b45e033c93', _rev: 'bad_rev'}};

        routes.delete('/api/templates', req)
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
      let req = {body: {name: 'created_template', properties: [{label: 'fieldLabel'}]}};
      let postResponse;

      routes.post('/api/templates', req)
      .then((response) => {
        postResponse = response;
        return request.get(dbURL + '/_design/templates/_view/all');
      })
      .then((response) => {
        let newDoc = response.json.rows.find((template) => {
          return template.value.name === 'created_template';
        });

        expect(newDoc.value.name).toBe('created_template');
        expect(newDoc.value.properties[0].label).toEqual('fieldLabel');
        expect(newDoc.value._rev).toBe(postResponse.rev);
        done();
      })
      .catch(done.fail);
    });

    it('should assign a unique safe property name based on the label for each property that does not have already a name', (done) => {
      let req = {body: {name: 'created_template', properties: [
        {label: 'label 1'},
        {label: 'label 2'},
        {label: 'label 2'},
        {label: 'label 2'},
        {label: 'label 3', name: 'has_name'},
        {label: 'has name'}
      ]}};

      routes.post('/api/templates', req)
      .then(() => {
        return request.get(dbURL + '/_design/templates/_view/all');
      })
      .then((response) => {
        let newDoc = response.json.rows.find((template) => {
          return template.value.name === 'created_template';
        });

        expect(newDoc.value.properties[0].name).toEqual('label_1');
        expect(newDoc.value.properties[1].name).toEqual('label_2');
        expect(newDoc.value.properties[2].name).toEqual('label_2-2');
        expect(newDoc.value.properties[3].name).toEqual('label_2-3');
        expect(newDoc.value.properties[4].name).toEqual('has_name');
        expect(newDoc.value.properties[5].name).toEqual('has_name-2');
        done();
      })
      .catch(done.fail);
    });

    it('should set a default value of [] to properties property if its missing', (done) => {
      let req = {body: {name: 'created_template'}};
      let postResponse;

      routes.post('/api/templates', req)
      .then((response) => {
        postResponse = response;
        return request.get(dbURL + '/_design/templates/_view/all');
      })
      .then((response) => {
        let newDoc = response.json.rows.find((template) => {
          return template.value.name === 'created_template';
        });

        expect(newDoc.value.name).toBe('created_template');
        expect(newDoc.value.properties).toEqual([]);
        expect(newDoc.value._rev).toBe(postResponse.rev);
        done();
      })
      .catch(done.fail);
    });

    describe('when passing _id and _rev', () => {
      it('edit an existing one', (done) => {
        request.get(dbURL + '/c08ef2532f0bd008ac5174b45e033c94')
        .then((response) => {
          let template = response.json;
          let req = {body: {_id: template._id, _rev: template._rev, name: 'changed name'}};
          return routes.post('/api/templates', req);
        })
        .then(() => {
          return request.get(dbURL + '/c08ef2532f0bd008ac5174b45e033c94');
        })
        .then((response) => {
          let template = response.json;
          expect(template.name).toBe('changed name');
          done();
        })
        .catch(done.fail);
      });
    });

    describe('when there is a db error', () => {
      it('return the error in the response', (done) => {
        let req = {body: {_id: 'c08ef2532f0bd008ac5174b45e033c93', _rev: 'bad_rev'}};
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
