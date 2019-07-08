import settingsRoutes from 'api/settings/routes.js';
import instrumentRoutes from 'api/utils/instrumentRoutes';
import settings from 'api/settings/settings';
import { catchErrors } from 'api/utils/jasmineHelpers';

describe('relationtypes routes', () => {
  let routes;
  const mockRequest = new Promise(resolve => resolve({ settings: 'response' }));

  beforeEach(() => {
    routes = instrumentRoutes(settingsRoutes);
  });

  describe('GET', () => {
    it('should have a validation schema', () => {
      expect(routes.get.validation('/api/settings')).toMatchSnapshot();
    });

    it('should respond with settings', (done) => {
      spyOn(settings, 'get').and.returnValue(mockRequest);
      routes.get('/api/settings')
      .then((response) => {
        expect(settings.get).toHaveBeenCalled();
        expect(response).toEqual({ settings: 'response' });
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('POST', () => {
    it('should have a validation schema', () => {
      expect(routes.post.validation('/api/settings')).toMatchSnapshot();
    });

    it('should save settings', (done) => {
      spyOn(settings, 'save').and.returnValue(mockRequest);
      routes.post('/api/settings', { body: { collection_name: 'my new name' } })
      .then((response) => {
        expect(settings.save).toHaveBeenCalledWith({ collection_name: 'my new name' });
        expect(response).toEqual({ settings: 'response' });
        done();
      })
      .catch(catchErrors(done));
    });
  });
});
