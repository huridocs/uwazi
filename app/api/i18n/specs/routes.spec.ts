import 'isomorphic-fetch';
import request from 'supertest';
import waitForExpect from 'wait-for-expect';
import { Logger } from 'winston';

import * as csvApi from 'api/csv/csvLoader';
import { TranslationDBO } from 'api/i18n.v2/schemas/TranslationDBO';
import i18nRoutes from 'api/i18n/routes';
import { errorLog } from 'api/log';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { iosocket, setUpApp } from 'api/utils/testingRoutes';
import { availableLanguages } from 'shared/languagesList';
import { LanguageSchema } from 'shared/types/commonTypes';
import { UserRole } from 'shared/types/userSchema';
import { DefaultTranslations } from '../defaultTranslations';
import { fixturesTranslationsV2ToTranslationsLegacy } from './fixturesTranslationsV2ToTranslationsLegacy';
import { sortByLocale } from './sortByLocale';

describe('i18n translations routes', () => {
  const createTranslationDBO = getFixturesFactory().v2.database.translationDBO;
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
    const translationsV2: TranslationDBO[] = [
      createTranslationDBO('title', 'Plantilla 1', 'es', {
        id: 'contextID',
        type: 'Entity',
        label: 'Template',
      }),
      createTranslationDBO('Search', 'Buscar', 'es', {
        id: 'System',
        type: 'Entity',
        label: 'User Interface',
      }),
      createTranslationDBO('title', 'Template 1', 'en', {
        id: 'contextID',
        type: 'Entity',
        label: 'Template',
      }),
      createTranslationDBO('Search', 'Search', 'en', {
        id: 'System',
        type: 'Uwazi UI',
        label: 'User Interface',
      }),
    ];
    await testingEnvironment.setUp(
      {
        settings: [
          {
            languages: [
              { key: 'en', label: 'English', default: true },
              { key: 'es', label: 'Spanish', default: false },
            ],
          },
        ],
        translationsV2,
        translations: fixturesTranslationsV2ToTranslationsLegacy(translationsV2),
      },
      'index'
    );
  });

  afterEach(() => {
    iosocket.emit.mockReset();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('GET', () => {
    describe('api/translations', () => {
      it('should return the translations', async () => {
        const response = await request(app).get('/api/translations').expect(200);

        expect(response.body.rows.sort(sortByLocale)).toMatchObject([
          {
            contexts: [
              {
                id: 'contextID',
                label: 'Template',
                type: 'Entity',
                values: { title: 'Template 1' },
              },
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
            contexts: [
              {
                id: 'contextID',
                label: 'Template',
                type: 'Entity',
                values: { title: 'Plantilla 1' },
              },
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
        ]);
      });

      it('should only return the requested context', async () => {
        const appWithQuery = setUpApp(i18nRoutes, (req, _res, next) => {
          req.user = {
            username: 'admin',
            role: UserRole.ADMIN,
            email: 'admin@test.com',
          };
          req.query = { context: 'contextID' };
          next();
        });

        const response = await request(appWithQuery).get('/api/translations').expect(200);

        expect(response.body.rows.sort(sortByLocale)).toMatchObject([
          {
            contexts: [
              {
                id: 'contextID',
                label: 'Template',
                type: 'Entity',
                values: { title: 'Template 1' },
              },
            ],
            locale: 'en',
          },

          {
            contexts: [
              {
                id: 'contextID',
                label: 'Template',
                type: 'Entity',
                values: { title: 'Plantilla 1' },
              },
            ],
            locale: 'es',
          },
        ]);
      });
    });

    describe('api/languages', () => {
      it('should return the available languages', async () => {
        DefaultTranslations.CONTENTS_DIRECTORY = `${__dirname}/test_contents/1`;

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

      describe('when github returns any error', () => {
        it('should return an unaltered version of the languages list', async () => {
          jest.spyOn(errorLog, 'error').mockImplementation(() => ({}) as Logger);
          DefaultTranslations.CONTENTS_DIRECTORY = `${__dirname}/non_valid`;

          const responseLanguages = await request(app).get('/api/languages').expect(200);

          expect(responseLanguages.body).toEqual(availableLanguages);
        });
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
            contexts: [
              {
                id: 'System',
                label: 'User Interface',
                type: 'Uwazi UI',
                values: { Search: 'Buscar' },
              },
            ],
          });

        expect(
          response.body.contexts.find((context: any) => context.id === 'System')
        ).toMatchObject({
          values: { Search: 'Buscar' },
        });

        expect(iosocket.emit).toHaveBeenCalledWith(
          'translationsChange',
          expect.objectContaining({
            contexts: expect.arrayContaining([
              expect.objectContaining({ values: { Search: 'Buscar' } }),
            ]),
            locale: 'es',
          })
        );
      });
    });

    describe('api/translations/languages', () => {
      let response: request.Response;
      let mockCalls: any[];

      const newSettings = {
        _id: expect.anything(),
        languages: [
          {
            _id: expect.anything(),
            key: 'en',
            label: 'English',
            default: true,
          },
          {
            _id: expect.anything(),
            key: 'es',
            label: 'Spanish',
            default: false,
          },
          {
            _id: expect.anything(),
            key: 'zh',
            label: 'Chinese',
          },
          {
            _id: expect.anything(),
            key: 'ja',
            label: 'Japanese',
          },
        ],
        mapStartingPoint: [
          {
            lon: 6,
            lat: 46,
          },
        ],
        links: [],
        filters: [],
      };

      beforeAll(async () => {
        DefaultTranslations.CONTENTS_DIRECTORY = `${__dirname}/test_contents/3`;

        response = await request(app)
          .post('/api/translations/languages')
          .send([
            { key: 'zh', label: 'Chinese' },
            { key: 'ja', label: 'Japanese' },
          ]);
        mockCalls = iosocket.emit.mock.calls;
        await waitForExpect(() => {
          expect(mockCalls.length).toBe(3);
        });
      });

      it('should return a 204', async () => {
        expect(response.status).toBe(204);
      });

      it('should emit a translationsChange event for each new language', async () => {
        const translationChangeEvents = mockCalls.filter(
          ([eventName]) => eventName === 'translationsChange'
        );
        expect(translationChangeEvents).toMatchObject([
          [
            'translationsChange',
            {
              locale: 'zh',
              contexts: [
                {
                  id: 'contextID',
                  label: 'Template',
                  type: 'Entity',
                  values: { title: 'Template 1' },
                },
                {
                  id: 'System',
                  label: 'User Interface',
                  type: 'Uwazi UI',
                  values: {
                    Search: 'Search',
                  },
                },
              ],
            },
          ],
          [
            'translationsChange',
            {
              locale: 'ja',
              contexts: [
                {
                  id: 'contextID',
                  label: 'Template',
                  type: 'Entity',
                  values: { title: 'Template 1' },
                },
                {
                  id: 'System',
                  label: 'User Interface',
                  type: 'Uwazi UI',
                  values: { Search: 'Search' },
                },
              ],
            },
          ],
        ]);
      });

      it('should emit an updateSettings event', async () => {
        const lastEvent = mockCalls[mockCalls.length - 1];
        expect(lastEvent).toMatchObject(['updateSettings', newSettings]);
      });
    });

    describe('api/translations/populate', () => {
      it('should save the translations', async () => {
        DefaultTranslations.CONTENTS_DIRECTORY = `${__dirname}/test_contents/2`;

        const response = await request(app)
          .post('/api/translations/populate')
          .send({ locale: 'es' })
          .expect(200);

        expect(response.body).toMatchObject([
          {
            contexts: [
              {
                id: 'contextID',
                label: 'Template',
                type: 'Entity',
                values: { title: 'Plantilla 1' },
              },
              {
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

  describe('DELETE', () => {
    describe('api/translations/languages', () => {
      let response: request.Response;
      let mockCalls: any[];

      beforeAll(async () => {
        response = await request(app).delete('/api/translations/languages?key=es').send();
        mockCalls = iosocket.emit.mock.calls;
        await waitForExpect(() => {
          expect(mockCalls.length).toBe(2);
        });
      });
      it('should return a 204', async () => {
        expect(response.status).toBe(204);
      });

      it('should emit an updateSettings event', async () => {
        const firstEvent = mockCalls[0];
        expect(firstEvent).toMatchObject([
          'updateSettings',
          {
            _id: expect.anything(),
            filters: [],
            languages: [
              {
                _id: expect.anything(),
                default: true,
                key: 'en',
                label: 'English',
              },
            ],
            links: [],
            mapStartingPoint: [
              {
                lat: 46,
                lon: 6,
              },
            ],
          },
        ]);
      });

      it('should emit a translationsDelete event', async () => {
        const lastEvent = mockCalls[mockCalls.length - 1];
        expect(lastEvent).toMatchObject(['translationsDelete', 'es']);
      });
    });
  });
});
