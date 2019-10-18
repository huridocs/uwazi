"use strict";var _instrumentRoutes = _interopRequireDefault(require("../../utils/instrumentRoutes"));
var _settings = _interopRequireDefault(require("../settings"));
var _jasmineHelpers = require("../../utils/jasmineHelpers");
var _routes = _interopRequireDefault(require("../routes.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('relationtypes routes', () => {
  let routes;
  const mockRequest = new Promise(resolve => resolve({ settings: 'response' }));

  beforeEach(() => {
    routes = (0, _instrumentRoutes.default)(_routes.default);
  });

  describe('GET', () => {
    it('should respond with settings', done => {
      spyOn(_settings.default, 'get').and.returnValue(mockRequest);
      routes.get('/api/settings').
      then(response => {
        expect(_settings.default.get).toHaveBeenCalled();
        expect(response).toEqual({ settings: 'response' });
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });
  });

  describe('POST', () => {
    it('should have a validation schema', () => {
      expect(routes.post.validation('/api/settings')).toMatchSnapshot();
    });

    it('should save settings', done => {
      spyOn(_settings.default, 'save').and.returnValue(mockRequest);
      routes.post('/api/settings', { body: { collection_name: 'my new name' } }).
      then(response => {
        expect(_settings.default.save).toHaveBeenCalledWith({ collection_name: 'my new name' });
        expect(response).toEqual({ settings: 'response' });
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });
  });
});