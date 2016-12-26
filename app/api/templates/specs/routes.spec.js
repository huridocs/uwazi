import templateRoutes from 'api/templates/routes.js';
import database from 'api/utils/database.js';
import fixtures from './fixtures.js';
import instrumentRoutes from 'api/utils/instrumentRoutes';
import templates from 'api/templates/templates';
import {catchErrors} from 'api/utils/jasmineHelpers';

describe('templates routes', () => {
  let routes;

  beforeEach((done) => {
    routes = instrumentRoutes(templateRoutes);
    database.reset_testing_database()
    .then(() => database.import(fixtures))
    .then(done)
    .catch(catchErrors(done));
  });

  describe('GET', () => {
    it('should return all templates by default', (done) => {
      routes.get('/api/templates')
      .then((response) => {
        let docs = response.rows;
        expect(docs[0].name).toBe('template_test');
        done();
      })
      .catch(catchErrors(done));
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
        .catch(catchErrors(done));
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
      .catch(catchErrors(done));
    });

    describe('when there is a db error', () => {
      it('should return the error in the response', (done) => {
        let req = {query: {_id: 'c08ef2532f0bd008ac5174b45e033c93', _rev: 'bad_rev'}};

        routes.delete('/api/templates', req)
        .then((response) => {
          expect(response.error.error).toBe('bad_request');
          done();
        })
        .catch(catchErrors(done));
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
      .catch(catchErrors(done));
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
        .catch(catchErrors(done));
      });
    });
  });

  describe('/templates/count_by_thesauri', () => {
    it('should return the number of templates using a thesauri', (done) => {
      spyOn(templates, 'countByThesauri').and.returnValue(Promise.resolve(2));
      let req = {query: {_id: 'abc1'}};
      routes.get('/api/templates/count_by_thesauri', req)
      .then((result) => {
        expect(result).toBe(2);
        expect(templates.countByThesauri).toHaveBeenCalledWith('abc1');
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('/templates/select_options', () => {
    it('should return the number of templates using a thesauri', (done) => {
      spyOn(templates, 'selectOptions').and.returnValue(Promise.resolve('options'));
      let req = {};
      routes.get('/api/templates/select_options', req)
      .then((result) => {
        expect(result).toBe('options');
        done();
      })
      .catch(catchErrors(done));
    });
  });
});
