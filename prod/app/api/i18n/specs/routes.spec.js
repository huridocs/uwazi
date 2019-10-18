"use strict";var _jasmineHelpers = require("../../utils/jasmineHelpers");
var _settings = _interopRequireDefault(require("../../settings"));
var _routes = _interopRequireDefault(require("../routes.js"));
var _instrumentRoutes = _interopRequireDefault(require("../../utils/instrumentRoutes"));
var _translations = _interopRequireDefault(require("../translations"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('i18n translations routes', () => {
  let routes;
  const mockRequest = new Promise(resolve => resolve({ translations: 'response' }));

  beforeEach(() => {
    routes = (0, _instrumentRoutes.default)(_routes.default);
  });

  describe('GET', () => {
    it('should return the translations', done => {
      spyOn(_translations.default, 'get').and.returnValue(mockRequest);
      routes.get('/api/translations').
      then(response => {
        expect(_translations.default.get).toHaveBeenCalled();
        expect(response).toEqual({ rows: { translations: 'response' } });
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });
  });

  describe('POST', () => {
    it('should have a validation schema', () => {
      expect(routes.post.validation('/api/translations')).toMatchSnapshot();
    });

    it('should save the translation', done => {
      spyOn(_translations.default, 'save').and.returnValue(Promise.resolve({ contexts: [], id: 'saved_translations' }));
      const emit = jasmine.createSpy('emit');
      routes.post('/api/translations', { body: { key: 'my new key' }, io: { sockets: { emit } } }).
      then(response => {
        expect(_translations.default.save).toHaveBeenCalledWith({ key: 'my new key' });
        expect(response).toEqual({ contexts: [], id: 'saved_translations' });
        expect(emit).toHaveBeenCalledWith('translationsChange', { contexts: [], id: 'saved_translations' });
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });
  });

  describe('POST /api/translations/setasdeafult', () => {
    it('should have a validation schema', () => {
      expect(routes.post.validation('/api/translations/setasdeafult')).toMatchSnapshot();
    });

    it('should update the setting', done => {
      spyOn(_settings.default, 'setDefaultLanguage').and.returnValue(Promise.resolve({ site_name: 'Uwazi' }));
      const emit = jasmine.createSpy('emit');
      routes.post('/api/translations/setasdeafult', { body: { key: 'fr' }, io: { sockets: { emit } } }).
      then(response => {
        expect(_settings.default.setDefaultLanguage).toHaveBeenCalledWith('fr');
        expect(response).toEqual({ site_name: 'Uwazi' });
        expect(emit).toHaveBeenCalledWith('updateSettings', { site_name: 'Uwazi' });
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });
  });
});