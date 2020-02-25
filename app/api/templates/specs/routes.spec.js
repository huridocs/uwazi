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
    it('should return all templates by default', done => {
      spyOn(templates, 'get').and.returnValue(Promise.resolve('templates'));
      routes
        .get('/api/templates')
        .then(response => {
          const docs = response.rows;
          expect(docs).toBe('templates');
          done();
        })
        .catch(catchErrors(done));
    });

    describe('when there is an error', () => {
      it('should return the error in the response', async () => {
        spyOn(templates, 'get').and.returnValue(Promise.reject(new Error('error')));
        try {
          await routes.get('/api/templates');
        } catch (error) {
          expect(error).toEqual(new Error('error'));
        }
      });
    });
  });

  describe('DELETE', () => {
    it('should have a validation schema', () => {
      expect(routes.delete.validation('/api/templates')).toMatchSnapshot();
    });
    it('should delete a template', done => {
      spyOn(templates, 'delete').and.returnValue(Promise.resolve('ok'));
      spyOn(settings, 'removeTemplateFromFilters').and.returnValue(Promise.resolve());
      routes
        .delete('/api/templates', { query: { _id: '123' } })
        .then(response => {
          expect(templates.delete).toHaveBeenCalledWith({ _id: '123' });
          expect(response).toEqual({ _id: '123' });
          done();
        })
        .catch(catchErrors(done));
    });

    describe('when there is an error', () => {
      it('should return the error in the response', async () => {
        spyOn(templates, 'delete').and.returnValue(Promise.reject(new Error('error')));

        try {
          await routes.delete('/api/templates', { query: {} });
        } catch (error) {
          expect(error).toEqual(new Error('error'));
        }
      });
    });
  });

  describe('POST', () => {
    const aTemplate = { _id: 'id', name: 'name' };
    const req = {
      body: { name: 'created_template', properties: [{ label: 'fieldLabel' }] },
      language: 'en',
      io: { sockets: {} },
    };
    let emitSpy;

    beforeEach(() => {
      emitSpy = jasmine.createSpy('emit');
      req.io.sockets.emit = emitSpy;
    });

    it('should have a validation schema', () => {
      expect(routes.post.validation('/api/templates')).toMatchSnapshot();
    });

    it('should create a template', async () => {
      spyOn(templates, 'save').and.returnValue(new Promise(resolve => resolve(aTemplate)));
      spyOn(settings, 'updateFilterName').and.returnValue(
        new Promise(resolve => resolve('updated settings'))
      );

      const response = await routes.post('/api/templates', req);

      expect(response).toBe(aTemplate);
      expect(templates.save).toHaveBeenCalledWith(req.body, req.language);
      expect(settings.updateFilterName).toHaveBeenCalledWith(aTemplate._id, aTemplate.name);
      expect(emitSpy).toHaveBeenCalledWith('templateChange', aTemplate);
      expect(emitSpy).toHaveBeenCalledWith('updateSettings', 'updated settings');
    });

    it('should not emit settings update when settings not modified', async () => {
      spyOn(templates, 'save').and.returnValue(new Promise(resolve => resolve(aTemplate)));
      spyOn(settings, 'updateFilterName').and.returnValue(undefined);

      await routes.post('/api/templates', req);

      expect(emitSpy).not.toHaveBeenCalledWith('updateSettings', 'updated settings');
    });

    describe('when there is an error', () => {
      it('should return the error in the response', async () => {
        spyOn(templates, 'save').and.returnValue(Promise.reject(new Error('error')));

        try {
          await routes.post('/api/templates');
        } catch (error) {
          expect(error).toEqual(new Error('error'));
        }
      });
    });
  });

  describe('/templates/count_by_thesauri', () => {
    it('should have a validation schema', () => {
      expect(routes.get.validation('/api/templates/count_by_thesauri')).toMatchSnapshot();
    });
    it('should return the number of templates using a thesauri', done => {
      spyOn(templates, 'countByThesauri').and.returnValue(Promise.resolve(2));
      const req = { query: { _id: 'abc1' } };
      routes
        .get('/api/templates/count_by_thesauri', req)
        .then(result => {
          expect(result).toBe(2);
          expect(templates.countByThesauri).toHaveBeenCalledWith('abc1');
          done();
        })
        .catch(catchErrors(done));
    });
  });

  describe('/api/templates/setasdefault', () => {
    it('should have a validation schema', () => {
      expect(routes.post.validation('/api/templates/setasdefault')).toMatchSnapshot();
    });

    it('should call templates to set the new default', done => {
      spyOn(templates, 'setAsDefault').and.returnValue(
        Promise.resolve([{ name: 'newDefault' }, { name: 'oldDefault' }])
      );
      const emit = jasmine.createSpy('emit');
      const req = { body: { _id: 'abc1' }, io: { sockets: { emit } } };
      routes
        .post('/api/templates/setasdefault', req)
        .then(result => {
          expect(result).toEqual({ name: 'newDefault' });
          expect(templates.setAsDefault).toHaveBeenCalledWith('abc1');
          expect(emit).toHaveBeenCalledWith('templateChange', { name: 'newDefault' });
          expect(emit).toHaveBeenCalledWith('templateChange', { name: 'oldDefault' });
          done();
        })
        .catch(catchErrors(done));
    });
  });
});
