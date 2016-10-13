import i18nRoutes from 'api/i18n/routes.js';
import instrumentRoutes from 'api/utils/instrumentRoutes';
import translations from 'api/i18n/translations';
import {catchErrors} from 'api/utils/jasmineHelpers';

describe('i18n translations routes', () => {
  let routes;
  let mockRequest = new Promise((resolve) => resolve({translations: 'response'}));

  beforeEach(() => {
    routes = instrumentRoutes(i18nRoutes);
  });

  describe('GET', () => {
    it('should ask relationtypes for all documents', (done) => {
      spyOn(translations, 'get').and.returnValue(mockRequest);
      routes.get('/api/i18n/translations')
      .then((response) => {
        expect(translations.get).toHaveBeenCalled();
        expect(response).toEqual({translations: 'response'});
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('POST', () => {
    it('should save the relationtype', (done) => {
      spyOn(translations, 'save').and.returnValue(mockRequest);
      routes.post('/api/i18n/translations', {body: {key: 'my new key'}})
      .then((response) => {
        expect(translations.save).toHaveBeenCalledWith({key: 'my new key'});
        expect(response).toEqual({translations: 'response'});
        done();
      })
      .catch(catchErrors(done));
    });
  });
});
