import request from 'supertest';
import 'isomorphic-fetch';

import * as csvApi from 'api/csv/csvLoader';
import i18nRoutes from 'api/i18n/routes';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { iosocket, setUpApp } from 'api/utils/testingRoutes';
import { UserRole } from 'shared/types/userSchema';
import backend from 'fetch-mock';
import { config } from 'api/config';
import { LanguageSchema } from 'shared/types/commonTypes';

describe('i18n translations routes', () => {
  const app = setUpApp(i18nRoutes, (req, _res, next) => {
    req.user = {
      username: 'admin',
      role: UserRole.ADMIN,
      email: 'admin@test.com',
    };
    // @ts-ignore
    req.file = { path: 'filder/filename.ext' };
    next();
  });

  beforeEach(async () => {
    await testingEnvironment.setUp({
      settings: [
        {
          languages: [
            { key: 'en', label: 'English', default: true },
            { key: 'es', label: 'Spanish', default: false },
          ],
        },
      ],
      translations: [
        {
          locale: 'en',
          contexts: [
            {
              id: 'System',
              label: 'User Interface',
              type: 'Uwazi UI',
              values: [{ key: 'Search', value: 'Search' }],
            },
          ],
        },
        {
          locale: 'es',
          contexts: [
            {
              id: 'System',
              label: 'User Interface',
              type: 'Uwazi UI',
              values: [{ key: 'Search', value: 'Buscar' }],
            },
          ],
        },
      ],
    });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('GET', () => {
    describe('api/translations', () => {
      it('should return the translations', async () => {
        const response = await request(app).get('/api/translations').expect(200);

        expect(response.body).toEqual({
          rows: [
            {
              _id: expect.any(String),
              contexts: [
                {
                  id: 'System',
                  label: 'User Interface',
                  type: 'Uwazi UI',
                  values: {
                    Search: 'Search',
                  },
                },
              ],
              locale: 'en',
            },

            {
              _id: expect.any(String),
              contexts: [
                {
                  id: 'System',
                  label: 'User Interface',
                  type: 'Uwazi UI',
                  values: {
                    Search: 'Buscar',
                  },
                },
              ],
              locale: 'es',
            },
          ],
        });
      });
    });

    describe('api/languages', () => {
      it('should return the available languages', async () => {
        const githubResponse = [{ name: 'ar.csv' }, { name: 'es.csv' }, { name: 'fr.csv' }];

        config.githubToken = 'gh_token';

        backend.get(
          (url, opts) =>
            url ===
              'https://api.github.com/repos/huridocs/uwazi-contents/contents/ui-translations/' &&
            // @ts-ignore
            opts?.headers?.Authorization === `Bearer ${config.githubToken}` &&
            // @ts-ignore
            opts?.headers?.accept === 'application/vnd.github.v4.raw',
          { body: githubResponse }
        );

        const response = await request(app).get('/api/languages').expect(200);

        const languagesWithPredefinedTranslations = response.body.filter(
          (language: LanguageSchema) => language.translationAvailable
        );

        expect(languagesWithPredefinedTranslations).toMatchObject([
          { key: 'ar' },
          { key: 'fr' },
          { key: 'es' },
        ]);
      });
    });
  });

  describe('POST', () => {
    describe('api/translations', () => {
      it('should save the translation', async () => {
        const response = await request(app)
          .post('/api/translations')
          .send({
            locale: 'es',
            contexts: [{ values: { Search: 'Buscar' } }],
          });

        expect(response.body).toEqual({
          __v: expect.any(Number),
          _id: expect.any(String),
          contexts: [
            {
              _id: expect.any(String),
              values: {
                Search: 'Buscar',
              },
            },
          ],
          locale: 'es',
        });

        expect(iosocket.emit).toHaveBeenCalledWith(
          'translationsChange',
          expect.objectContaining({
            contexts: [expect.objectContaining({ values: { Search: 'Buscar' } })],
            locale: 'es',
          })
        );
      });
    });

    describe('api/translations/populate', () => {
      afterEach(() => {
        backend.restore();
      });

      it('should save the translations', async () => {
        const spanishCsv = `Key,Spanish
      Search,Buscar traducida`;

        config.githubToken = 'gh_token';

        backend.get(
          (url, opts) =>
            url ===
              'https://api.github.com/repos/huridocs/uwazi-contents/contents/ui-translations/es.csv' &&
            // @ts-ignore
            opts?.headers?.Authorization === `Bearer ${config.githubToken}` &&
            // @ts-ignore
            opts?.headers?.accept === 'application/vnd.github.v4.raw',
          { body: spanishCsv }
        );

        const response = await request(app)
          .post('/api/translations/populate')
          .send({ locale: 'es' })
          .expect(200);

        expect(response.body).toEqual([
          {
            _id: expect.any(String),
            contexts: [
              {
                _id: expect.any(String),
                id: 'System',
                label: 'User Interface',
                type: 'Uwazi UI',
                values: {
                  Search: 'Buscar traducida',
                },
              },
            ],
            locale: 'es',
          },
        ]);
      });

      it('should response with error when Github quota exceeded', async () => {
        backend.get(
          'https://api.github.com/repos/huridocs/uwazi-contents/contents/ui-translations/es.csv',
          { status: 403 }
        );
        const response = await request(app)
          .post('/api/translations/populate')
          .send({ locale: 'es' })
          .expect(503);

        expect(response.body).toMatchObject({ error: 'Translations could not be loaded' });
      });

      it('should response with error when Github authentication failed', async () => {
        backend.get(
          'https://api.github.com/repos/huridocs/uwazi-contents/contents/ui-translations/es.csv',
          { status: 401 }
        );
        const response = await request(app)
          .post('/api/translations/populate')
          .send({ locale: 'es' })
          .expect(503);

        expect(response.body).toMatchObject({
          error: 'Github authentication failed',
        });
      });

      it('should response with error when Github authentication failed', async () => {
        backend.get(
          'https://api.github.com/repos/huridocs/uwazi-contents/contents/ui-translations/zh.csv',
          { status: 404 }
        );
        const response = await request(app)
          .post('/api/translations/populate')
          .send({ locale: 'zh' })
          .expect(422);

        expect(response.body).toMatchObject({
          error: 'Predefined translation for locale zh is not available',
        });
      });
    });

    describe('api/translations/setasdeafult', () => {
      it('should update the setting', async () => {
        const response = await request(app)
          .post('/api/translations/setasdeafult')
          .send({ key: 'es' });

        expect(response.body).toMatchObject({
          languages: [
            {
              key: 'en',
              default: false,
            },
            {
              key: 'es',
              default: true,
            },
          ],
        });
        expect(iosocket.emit).toHaveBeenCalledWith(
          'updateSettings',
          expect.objectContaining({
            languages: [
              expect.objectContaining({ default: false, key: 'en', label: 'English' }),
              expect.objectContaining({ default: true, key: 'es', label: 'Spanish' }),
            ],
          })
        );
      });
    });

    describe('api/<translations>/import', () => {
      let csvLoaderMock: jest.SpyInstance;
      let loadTranslationsMock: jest.Mock;

      beforeEach(async () => {
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
