"use strict";var _jasmineHelpers = require("../../utils/jasmineHelpers");
var _instrumentRoutes = _interopRequireDefault(require("../../utils/instrumentRoutes"));
var _settings = _interopRequireDefault(require("../../settings/settings"));
var _templates = _interopRequireDefault(require("../templates"));
var _routes = _interopRequireDefault(require("../routes.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('templates routes', () => {
  let routes;

  beforeEach(() => {
    routes = (0, _instrumentRoutes.default)(_routes.default);
  });

  describe('GET', () => {
    it('should return all templates by default', done => {
      spyOn(_templates.default, 'get').and.returnValue(Promise.resolve('templates'));
      routes.get('/api/templates').
      then(response => {
        const docs = response.rows;
        expect(docs).toBe('templates');
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });

    describe('when there is an error', () => {
      it('should return the error in the response', async () => {
        spyOn(_templates.default, 'get').and.returnValue(Promise.reject(new Error('error')));
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
      spyOn(_templates.default, 'delete').and.returnValue(Promise.resolve('ok'));
      spyOn(_settings.default, 'removeTemplateFromFilters').and.returnValue(Promise.resolve());
      routes.delete('/api/templates', { query: { _id: '123' } }).
      then(response => {
        expect(_templates.default.delete).toHaveBeenCalledWith({ _id: '123' });
        expect(response).toEqual({ _id: '123' });
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });

    describe('when there is an error', () => {
      it('should return the error in the response', async () => {
        spyOn(_templates.default, 'delete').and.returnValue(Promise.reject(new Error('error')));

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
    const req = { body: { name: 'created_template', properties: [{ label: 'fieldLabel' }] }, language: 'en', io: { sockets: {} } };
    let emitSpy;

    beforeEach(() => {
      emitSpy = jasmine.createSpy('emit');
      req.io.sockets.emit = emitSpy;
    });

    it('should have a validation schema', () => {
      expect(routes.post.validation('/api/templates')).toMatchSnapshot();
    });

    it('should create a template', async () => {
      spyOn(_templates.default, 'save').and.returnValue(new Promise(resolve => resolve(aTemplate)));
      spyOn(_settings.default, 'updateFilterName').and.returnValue(new Promise(resolve => resolve('updated settings')));

      const response = await routes.post('/api/templates', req);

      expect(response).toBe(aTemplate);
      expect(_templates.default.save).toHaveBeenCalledWith(req.body, req.language);
      expect(_settings.default.updateFilterName).toHaveBeenCalledWith(aTemplate._id, aTemplate.name);
      expect(emitSpy).toHaveBeenCalledWith('templateChange', aTemplate);
      expect(emitSpy).toHaveBeenCalledWith('updateSettings', 'updated settings');
    });

    it('should not emit settings update when settings not modified', async () => {
      spyOn(_templates.default, 'save').and.returnValue(new Promise(resolve => resolve(aTemplate)));
      spyOn(_settings.default, 'updateFilterName').and.returnValue(undefined);

      await routes.post('/api/templates', req);

      expect(emitSpy).not.toHaveBeenCalledWith('updateSettings', 'updated settings');
    });

    describe('when there is an error', () => {
      it('should return the error in the response', async () => {
        spyOn(_templates.default, 'save').and.returnValue(Promise.reject(new Error('error')));

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
      spyOn(_templates.default, 'countByThesauri').and.returnValue(Promise.resolve(2));
      const req = { query: { _id: 'abc1' } };
      routes.get('/api/templates/count_by_thesauri', req).
      then(result => {
        expect(result).toBe(2);
        expect(_templates.default.countByThesauri).toHaveBeenCalledWith('abc1');
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });
  });

  describe('/api/templates/setasdefault', () => {
    it('should have a validation schema', () => {
      expect(routes.post.validation('/api/templates/setasdefault')).toMatchSnapshot();
    });

    it('should call templates to set the new default', done => {
      spyOn(_templates.default, 'setAsDefault').and.returnValue(Promise.resolve([{ name: 'newDefault' }, { name: 'oldDefault' }]));
      const emit = jasmine.createSpy('emit');
      const req = { body: { _id: 'abc1' }, io: { sockets: { emit } } };
      routes.post('/api/templates/setasdefault', req).
      then(result => {
        expect(result).toEqual({ name: 'newDefault' });
        expect(_templates.default.setAsDefault).toHaveBeenCalledWith('abc1');
        expect(emit).toHaveBeenCalledWith('templateChange', { name: 'newDefault' });
        expect(emit).toHaveBeenCalledWith('templateChange', { name: 'oldDefault' });
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });
  });
});