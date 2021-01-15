import { catchErrors } from 'api/utils/jasmineHelpers';
import instrumentRoutes from 'api/utils/instrumentRoutes';
import settings from 'api/settings/settings';
import db from 'api/utils/testing_db';
import * as entitiesIndex from 'api/search/entitiesIndex';
import templates from '../templates';
import templateRoutes from '../routes.js';

const mocketSocketIo = () => ({
  emitToCurrentTenant: jasmine.createSpy('emitToCurrentTenant'),
});

describe('templates routes', () => {
  let routes;

  beforeEach(async () => {
    routes = instrumentRoutes(templateRoutes);
    await db.clearAllAndLoad({
      templates: [{ name: 'testing template', properties: [{ name: 'name', type: 'text' }] }],
    });
    spyOn(entitiesIndex, 'updateMapping').and.returnValue(Promise.resolve());
    spyOn(entitiesIndex, 'checkMapping').and.returnValue(
      Promise.resolve({ errors: [], valid: true })
    );
  });

  afterAll(async () => {
    await db.disconnect();
  });

  describe('GET', () => {
    it('should return all templates by default', done => {
      spyOn(templates, 'get').and.returnValue(Promise.resolve('templates'));
      routes
        .get('/api/templates')
        .then(response => {
          const tmpls = response.rows;
          expect(tmpls).toBe('templates');
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

    it('should create a template', async () => {
      const req = {
        body: { name: 'created_template', properties: [{ label: 'fieldLabel' }] },
        language: 'en',
        io: mocketSocketIo(),
      };

      spyOn(templates, 'save').and.returnValue(new Promise(resolve => resolve(aTemplate)));
      spyOn(settings, 'updateFilterName').and.returnValue(
        new Promise(resolve => resolve('updated settings'))
      );

      const response = await routes.post('/api/templates', req);

      expect(response).toBe(aTemplate);
      expect(templates.save).toHaveBeenCalledWith(req.body, req.language, true);
      expect(settings.updateFilterName).toHaveBeenCalledWith(aTemplate._id, aTemplate.name);
      expect(req.io.emitToCurrentTenant).toHaveBeenCalledWith('templateChange', aTemplate);
      expect(req.io.emitToCurrentTenant).toHaveBeenCalledWith('updateSettings', 'updated settings');
    });

    it('should not emit settings update when settings not modified', async () => {
      const req = {
        body: { name: 'created_template', properties: [{ label: 'fieldLabel' }] },
        language: 'en',
        io: mocketSocketIo(),
      };

      spyOn(templates, 'save').and.returnValue(new Promise(resolve => resolve(aTemplate)));
      spyOn(settings, 'updateFilterName').and.returnValue(undefined);

      await routes.post('/api/templates', req);

      expect(req.io.emitToCurrentTenant).not.toHaveBeenCalledWith(
        'updateSettings',
        'updated settings'
      );
    });

    describe('when there is an error', () => {
      it('should return the error in the response', async () => {
        spyOn(templates, 'save').and.returnValue(Promise.reject(new Error('error')));

        try {
          await routes.post('/api/templates', { body: {} });
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
      const req = { body: { _id: 'abc1' }, io: mocketSocketIo() };
      routes
        .post('/api/templates/setasdefault', req)
        .then(result => {
          expect(result).toEqual({ name: 'newDefault' });
          expect(templates.setAsDefault).toHaveBeenCalledWith('abc1');
          expect(req.io.emitToCurrentTenant).toHaveBeenCalledWith('templateChange', {
            name: 'newDefault',
          });
          expect(req.io.emitToCurrentTenant).toHaveBeenCalledWith('templateChange', {
            name: 'oldDefault',
          });
          done();
        })
        .catch(catchErrors(done));
    });
  });

  describe('/api/templates/check_mapping', () => {
    it('should check if a template is valid vs the current elasticsearch mapping', async () => {
      const req = { body: { _id: 'abc1', properties: [] }, io: mocketSocketIo() };
      const result = await routes.post('/api/templates/check_mapping', req);
      expect(result).toEqual({ errors: [], valid: true });
    });
  });
});
