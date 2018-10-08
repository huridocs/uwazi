import { catchErrors } from 'api/utils/jasmineHelpers';
import instrumentRoutes from 'api/utils/instrumentRoutes';
import settings from 'api/settings/settings';
import templates from '../templates';
import templateRoutes from '../routes.js';

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
        const docs = response.rows;
        expect(docs).toBe('templates');
        done();
      })
      .catch(catchErrors(done));
    });

    describe('when there is an error', () => {
      it('should return the error in the response', async () => {
        spyOn(templates, 'get').and.returnValue(Promise.reject(new Error('error')));
        const next = jasmine.createSpy('next');

        await routes.get('/api/templates', {}, {}, next);
        expect(next).toHaveBeenCalledWith(new Error('error'));
      });
    });
  });

  describe('DELETE', () => {
    it('should have a validation schema', () => {
      expect(routes.delete.validation('/api/templates')).toMatchSnapshot();
    });
    it('should delete a template', (done) => {
      spyOn(templates, 'delete').and.returnValue(Promise.resolve('ok'));
      spyOn(settings, 'removeTemplateFromFilters').and.returnValue(Promise.resolve());
      routes.delete('/api/templates', { query: { _id: '123' } })
      .then((response) => {
        expect(templates.delete).toHaveBeenCalledWith({ _id: '123' });
        expect(response).toEqual({ _id: '123' });
        done();
      })
      .catch(catchErrors(done));
    });

    describe('when there is an error', () => {
      it('should return the error in the response', async () => {
        spyOn(templates, 'delete').and.returnValue(Promise.reject(new Error('error')));
        const next = jasmine.createSpy('next');

        await routes.delete('/api/templates', { query: {} }, {}, next);
        expect(next).toHaveBeenCalledWith(new Error('error'));
      });
    });
  });

  describe('POST', () => {
    it('should have a validation schema', () => {
      expect(routes.post.validation('/api/templates')).toMatchSnapshot();
    });
    it('should create a template', (done) => {
      spyOn(templates, 'save').and.returnValue(new Promise(resolve => resolve('response')));
      const req = { body: { name: 'created_template', properties: [{ label: 'fieldLabel' }] }, language: 'en' };

      routes.post('/api/templates', req)
      .then((response) => {
        expect(response).toBe('response');
        expect(templates.save).toHaveBeenCalledWith(req.body, req.language);
        done();
      })
      .catch(catchErrors(done));
    });

    describe('when there is an error', () => {
      it('should return the error in the response', async () => {
        spyOn(templates, 'save').and.returnValue(Promise.reject(new Error('error')));
        const next = jasmine.createSpy('next');

        await routes.post('/api/templates', {}, {}, next);
        expect(next).toHaveBeenCalledWith(new Error('error'));
      });
    });
  });

  describe('/templates/count_by_thesauri', () => {
    it('should have a validation schema', () => {
      expect(routes.get.validation('/api/templates/count_by_thesauri')).toMatchSnapshot();
    });
    it('should return the number of templates using a thesauri', (done) => {
      spyOn(templates, 'countByThesauri').and.returnValue(Promise.resolve(2));
      const req = { query: { _id: 'abc1' } };
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
