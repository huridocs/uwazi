"use strict";require("../../utils/jasmineHelpers");
var _instrumentRoutes = _interopRequireDefault(require("../../utils/instrumentRoutes"));
var _routes = _interopRequireDefault(require("../routes.js"));
var _activitylog = _interopRequireDefault(require("../activitylog"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('Activitylog routes', () => {
  let routes;

  beforeEach(() => {
    routes = (0, _instrumentRoutes.default)(_routes.default);
    spyOn(_activitylog.default, 'get').and.returnValue(Promise.resolve('activitylogs'));
  });

  describe('GET', () => {
    it('should have a validation schema and require authorization', () => {
      expect(routes.get.validation('/api/activitylog')).toMatchSnapshot();
      expect(routes._get('/api/activitylog', {})).toNeedAuthorization();
    });

    it('should return the log with passed query', async () => {
      const req = { query: { method: '{"action":"POST"}', time: '{"from":1234}' } };

      const response = await routes.get('/api/activitylog', req);

      expect(_activitylog.default.get).toHaveBeenCalledWith({ method: { action: 'POST' }, time: { from: 1234 } });
      expect(response).toBe('activitylogs');
    });

    it('should not attempt to parse undefined method and time', async () => {
      const req = { query: {} };
      await routes.get('/api/activitylog', req);
      expect(_activitylog.default.get).toHaveBeenCalledWith({ method: undefined, time: undefined });
    });
  });
});