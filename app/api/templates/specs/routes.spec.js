import templateRoutes from 'api/templates/routes.js';
import database from 'api/utils/database.js';
import fixtures from './fixtures.js';
import instrumentRoutes from 'api/utils/instrumentRoutes';
import templates from 'api/templates/templates';
import {catchErrors} from 'api/utils/jasmineHelpers';

describe('templates routes', () => {
  let routes;

  beforeEach(() => {
    routes = instrumentRoutes(templateRoutes);
  });

  describe('GET', () => {
    it('should return all templates by default', (done) => {
      spyOn(templates, 'get').and.returnValue(Promise.resolve('templates'));
      routes.get('/api/templates')
      .then((response) => {
        let docs = response.rows;
        expect(docs).toBe('templates');
        done();
      })
      .catch(catchErrors(done));
    });

    describe('when there is an error', () => {
      it('should return the error in the response', (done) => {
        spyOn(templates, 'get').and.returnValue(Promise.reject('error'));

        routes.get('/api/templates', {})
        .then((response) => {
          expect(response.error).toBe('error');
          done();
        })
        .catch(catchErrors(done));
      });
    });
  });

  describe('DELETE', () => {
    it('should delete a template', (done) => {
      spyOn(templates, 'delete').and.returnValue(Promise.resolve('ok'));
      routes.delete('/api/templates', {query: {_id: '123'}})
      .then((response) => {
        expect(templates.delete).toHaveBeenCalledWith({_id: '123'});
        expect(response).toEqual({_id: '123'});
        done();
      })
      .catch(catchErrors(done));
    });

    describe('when there is an error', () => {
      it('should return the error in the response', (done) => {
        spyOn(templates, 'delete').and.returnValue(Promise.reject('error'));

        routes.delete('/api/templates', {query: {}})
        .then((response) => {
          expect(response.error).toBe('error');
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

    describe('when there is an error', () => {
      it('should return the error in the response', (done) => {
        spyOn(templates, 'save').and.returnValue(Promise.reject('error'));
        routes.post('/api/templates', {})
        .then((response) => {
          expect(response.error).toBe('error');
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
});
