import {db_url as dbURL} from 'api/config/database.js';
import templateRoutes from 'api/templates/routes.js';
import database from 'api/utils/database.js';
import fixtures from './fixtures.js';
import request from 'shared/JSONRequest';
import instrumentRoutes from 'api/utils/instrumentRoutes';
import templates from 'api/templates/templates';

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
      spyOn(templates, 'delete').and.returnValue(Promise.resolve('ok'));
      routes.delete('/api/templates', {query: 'template'})
      .then((response) => {
        expect(templates.delete).toHaveBeenCalledWith('template');
        expect(response).toBe('ok');
        done();
      })
      .catch(done.fail);
    });

    describe('when there is a db error', () => {
      it('should return the error in the response', (done) => {
        let req = {query: {_id: 'c08ef2532f0bd008ac5174b45e033c93', _rev: 'bad_rev'}};

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
      spyOn(templates, 'save').and.returnValue(new Promise((resolve) => resolve('response')));
      let req = {body: {name: 'created_template', properties: [{label: 'fieldLabel'}]}};

      routes.post('/api/templates', req)
      .then((response) => {
        expect(response).toBe('response');
        expect(templates.save).toHaveBeenCalledWith(req.body);
        done();
      })
      .catch(done.fail);
    });

    describe('when there is a db error', () => {
      it('should return the error in the response', (done) => {
        spyOn(templates, 'save').and.returnValue(new Promise((resolve, reject) => reject('error')));
        let req = {body: {}};
        routes.post('/api/templates', req)
        .then((error) => {
          expect(error.error).toBe('error');
          done();
        })
        .catch(done.fail);
      });
    });
  });
});
