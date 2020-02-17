import 'api/utils/jasmineHelpers';
import instrumentRoutes from 'api/utils/instrumentRoutes';
import activitylogRoutes from '../routes.js';
import activitylog from '../activitylog';

describe('Activitylog routes', () => {
  let routes;

  beforeEach(() => {
    routes = instrumentRoutes(activitylogRoutes);
    spyOn(activitylog, 'get').and.returnValue(Promise.resolve('activitylogs'));
  });

  describe('GET', () => {
    it('should have a validation schema and require authorization', () => {
      expect(routes.get.validation('/api/activitylog')).toMatchSnapshot();
      expect(routes._get('/api/activitylog', {})).toNeedAuthorization();
    });

    it('should return the log with passed query', async () => {
      const req = { query: { method: '{"action":"POST"}', time: '{"from":1234}' } };

      const response = await routes.get('/api/activitylog', req);

      expect(activitylog.get).toHaveBeenCalledWith({
        method: { action: 'POST' },
        time: { from: 1234 },
      });
      expect(response).toBe('activitylogs');
    });

    it('should not attempt to parse undefined method and time', async () => {
      const req = { query: {} };
      await routes.get('/api/activitylog', req);
      expect(activitylog.get).toHaveBeenCalledWith({ method: undefined, time: undefined });
    });
  });
});
