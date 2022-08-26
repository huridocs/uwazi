import request from 'supertest';

import * as csvApi from 'api/csv/csvLoader';
import i18nRoutes from 'api/i18n/routes';
import translations from 'api/i18n/translations';
import settings from 'api/settings';
import instrumentRoutes from 'api/utils/instrumentRoutes';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { setUpApp } from 'api/utils/testingRoutes';
import { UserRole } from 'shared/types/userSchema';
import { availableLanguages } from 'shared/languagesList';
import { Application } from 'express';

const mockSocketIo = () => ({
  emitToCurrentTenant: jasmine.createSpy('emitToCurrentTenant'),
});

describe('i18n translations routes', () => {
  let routes;
  beforeEach(() => {
    routes = instrumentRoutes(i18nRoutes);
  });

  describe('GET', () => {
    describe('api/translations', () => {
      it('should return the translations', async () => {
        jest.spyOn(translations, 'get').mockResolvedValueOnce({ translations: 'response' });

        const response = await routes.get('/api/translations');

        expect(translations.get).toHaveBeenCalled();
        expect(response).toEqual({ rows: { translations: 'response' } });
      });
    });

    describe('api/languages', () => {
      it('should return the available languages', async () => {
        const response = await routes.get('/api/languages');

        expect(response).toEqual(availableLanguages);
      });
    });
  });

  describe('POST', () => {
    describe('api/translations', () => {
      it('should have a validation schema', () => {
        expect(routes.post.validation('/api/translations')).toMatchSnapshot();
      });

      it('should save the translation', async () => {
        jest
          .spyOn(translations, 'save')
          .mockResolvedValueOnce({ contexts: [], id: 'saved_translations' });
        const sockets = mockSocketIo();

        const response = await routes.post('/api/translations', {
          body: { key: 'my new key' },
          sockets,
        });

        expect(translations.save).toHaveBeenCalledWith({ key: 'my new key' });
        expect(response).toEqual({ contexts: [], id: 'saved_translations' });
        expect(sockets.emitToCurrentTenant).toHaveBeenCalledWith('translationsChange', {
          contexts: [],
          id: 'saved_translations',
        });
      });
    });

    describe('api/translations/populate', () => {
      it('should have a validation schema', () => {
        expect(routes.post.validation('/api/translations/populate')).toMatchSnapshot();
      });

      it('should save the translations', async () => {
        jest.spyOn(translations, 'importPredefined').mockResolvedValueOnce(undefined);

        const response = await routes.post('/api/translations/populate', {
          body: { locale: 'es' },
        });

        expect(translations.importPredefined).toHaveBeenCalledWith('es');
        expect(response).toEqual({ locale: 'es' });
      });
    });

    describe('api/translations/setasdeafult', () => {
      it('should have a validation schema', () => {
        expect(routes.post.validation('/api/translations/setasdeafult')).toMatchSnapshot();
      });

      it('should update the setting', async () => {
        jest.spyOn(settings, 'setDefaultLanguage').mockResolvedValueOnce({ site_name: 'Uwazi' });
        const sockets = mockSocketIo();

        const response = await routes.post('/api/translations/setasdeafult', {
          body: { key: 'fr' },
          sockets,
        });

        expect(settings.setDefaultLanguage).toHaveBeenCalledWith('fr');
        expect(response).toEqual({ site_name: 'Uwazi' });
        expect(sockets.emitToCurrentTenant).toHaveBeenCalledWith('updateSettings', {
          site_name: 'Uwazi',
        });
      });
    });
  });
});
