import request from 'supertest';

import * as csvApi from 'api/csv/csvLoader';
import i18nRoutes from 'api/i18n/routes.js';
import translations from 'api/i18n/translations';
import settings from 'api/settings';
import instrumentRoutes from 'api/utils/instrumentRoutes';
import { catchErrors } from 'api/utils/jasmineHelpers';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { setUpApp } from 'api/utils/testingRoutes';
import { UserRole } from 'shared/types/userSchema';
import { availableLanguages } from 'shared/languagesList';

const mockSocketIo = () => ({
  emitToCurrentTenant: jasmine.createSpy('emitToCurrentTenant'),
});

describe('i18n translations routes', () => {
  let routes;
  const mockRequest = new Promise(resolve => {
    resolve({ translations: 'response' });
  });

  beforeEach(() => {
    routes = instrumentRoutes(i18nRoutes);
  });

  describe('GET', () => {
    describe('api/translations', () => {
      it('should return the translations', done => {
        spyOn(translations, 'get').and.returnValue(mockRequest);
        routes
          .get('/api/translations')
          .then(response => {
            expect(translations.get).toHaveBeenCalled();
            expect(response).toEqual({ rows: { translations: 'response' } });
            done();
          })
          .catch(catchErrors(done));
      });
    });

    describe('api/languages', () => {
      it('should return the available languages', done => {
        routes
          .get('/api/languages')
          .then(response => {
            expect(response).toEqual(availableLanguages);
            done();
          })
          .catch(catchErrors(done));
      });
    });
  });

  describe('POST', () => {
    describe('api/translations', () => {
      it('should have a validation schema', () => {
        expect(routes.post.validation('/api/translations')).toMatchSnapshot();
      });

      it('should save the translation', done => {
        spyOn(translations, 'save').and.returnValue(
          Promise.resolve({ contexts: [], id: 'saved_translations' })
        );
        const sockets = mockSocketIo();
        routes
          .post('/api/translations', { body: { key: 'my new key' }, sockets })
          .then(response => {
            expect(translations.save).toHaveBeenCalledWith({ key: 'my new key' });
            expect(response).toEqual({ contexts: [], id: 'saved_translations' });
            expect(sockets.emitToCurrentTenant).toHaveBeenCalledWith('translationsChange', {
              contexts: [],
              id: 'saved_translations',
            });
            done();
          })
          .catch(catchErrors(done));
      });
    });

    describe('api/translations/setasdeafult', () => {
      it('should have a validation schema', () => {
        expect(routes.post.validation('/api/translations/setasdeafult')).toMatchSnapshot();
      });

      it('should update the setting', done => {
        spyOn(settings, 'setDefaultLanguage').and.returnValue(
          Promise.resolve({ site_name: 'Uwazi' })
        );
        const sockets = mockSocketIo();
        routes
          .post('/api/translations/setasdeafult', { body: { key: 'fr' }, sockets })
          .then(response => {
            expect(settings.setDefaultLanguage).toHaveBeenCalledWith('fr');
            expect(response).toEqual({ site_name: 'Uwazi' });
            expect(sockets.emitToCurrentTenant).toHaveBeenCalledWith('updateSettings', {
              site_name: 'Uwazi',
            });
            done();
          })
          .catch(catchErrors(done));
      });
    });

    describe('api/translations/import', () => {
      let csvLoaderMock;
      let loadTranslationsMock;
      const app = setUpApp(i18nRoutes, (req, _res, next) => {
        req.user = {
          username: 'admin',
          role: UserRole.ADMIN,
          email: 'admin@test.com',
        };
        req.file = { path: 'filder/filename.ext' };
        next();
      });

      beforeEach(async () => {
        await testingEnvironment.setUp({
          settings: [
            {
              languages: [{ key: 'en', label: 'English', default: true }],
            },
          ],
        });
        csvLoaderMock = jest.spyOn(csvApi, 'CSVLoader');
        csvLoaderMock.mockImplementation(() => {
          const mockObj = {
            loadTranslations: jest.fn(() => []),
          };
          loadTranslationsMock = mockObj.loadTranslations;
          return mockObj;
        });
      });

      afterAll(async () => {
        csvLoaderMock.mockRestore();
        await testingEnvironment.tearDown();
      });

      it.each([
        {
          body: { context: 0 },
          expectedError: 'type',
          expectedPath: '/body/context',
        },
        {
          req: { body: {}, file: { path: 'filepath' } },
          expectedError: 'required',
          expectedPath: '/body',
        },
      ])(
        'should return a validation error on $expectedError error',
        async ({ body, expectedError, expectedPath }) => {
          const response = await request(app)
            .post('/api/translations/import')
            .send(body)
            .expect(400);
          expect(response.body.errors[0].keyword).toBe(expectedError);
          expect(response.body.errors[0].instancePath).toBe(expectedPath);
          expect(response.body.error).toBe('validation failed');
        }
      );

      it('should load csv', async () => {
        await request(app)
          .post('/api/translations/import')
          .send({ context: 'context' })
          .expect(200);
        expect(loadTranslationsMock).toHaveBeenCalledWith('filder/filename.ext', 'context');
      });
    });
  });
});
