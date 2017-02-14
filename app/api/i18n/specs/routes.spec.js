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
    fit('should return the translations', (done) => {
      spyOn(translations, 'get').and.returnValue(mockRequest);
      routes.get('/api/translations')
      .then((response) => {
        expect(translations.get).toHaveBeenCalled();
        expect(response).toEqual({translations: 'response'});
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('POST', () => {
    fit('should save the translation', (done) => {
      spyOn(translations, 'save').and.returnValue(mockRequest);
      routes.post('/api/translations', {body: {key: 'my new key'}})
      .then((response) => {
        expect(translations.save).toHaveBeenCalledWith({key: 'my new key'});
        expect(response).toEqual({translations: 'response'});
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('POST addentry', () => {
    fit('should add entry to a translation context', (done) => {
      spyOn(translations, 'addEntry').and.returnValue(mockRequest);
      routes.post('/api/translations/addentry', {body: {context: 'System', key: 'Search', value: 'Buscar'}})
      .then((response) => {
        expect(translations.addEntry).toHaveBeenCalledWith('System', 'Search', 'Buscar');
        expect(response).toEqual({translations: 'response'});
        done();
      })
      .catch(catchErrors(done));
    });
  });
});
