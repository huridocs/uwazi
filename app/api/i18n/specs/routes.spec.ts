import 'isomorphic-fetch';
import request from 'supertest';
import waitForExpect from 'wait-for-expect';

import * as csvApi from '#api/csv/csvLoader.js';
import { TranslationDBO } from '#api/i18n.v2/schemas/TranslationDBO.js';
import i18nRoutes from '#api/i18n/routes.js';
import settings from '#api/settings/index.js';
import { MongoSettingsDataSource } from '#api/core/infrastructure/mongodb/MongoSettingsDataSource.js';
import '#api/pages.v2/infrastructure/listeners/AddLanguagePagesListener.js';
import '#api/pages.v2/infrastructure/listeners/DeleteLanguagePagesListener.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { TestEmitSources, iosocket, setUpApp } from '#api/utils/testingRoutes.js';
import { availableLanguages } from '#shared/language/index.js';
import { LanguageSchema } from '#shared/types/commonTypes.js';
import { UserRole } from '#shared/types/userSchema.js';
import { search } from '#api/search/index.js';
import { DefaultTranslations } from '../defaultTranslations.js';
import { sortByLocale } from './sortByLocale.js';

describe('i18n translations routes', () => {
  const createTranslationDBO = getFixturesFactory().v2.database.translationDBO;
  const app = setUpApp(i18nRoutes, (req, _res, next) => {
    req.user = {
      _id: 'admin',
      username: 'admin',
      role: UserRole.ADMIN,
      email: 'admin@test.com',
    };
    // @ts-ignore
    req.file = { path: 'filder/filename.ext' };
    next();
  });

  beforeAll(() => {
    jest.spyOn(search, 'deleteLanguage').mockResolvedValue(undefined as any);
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
    await testingEnvironment.setUp({
      settings: [
        {
          languages: [
            { key: 'en', label: 'English', default: true },
            { key: 'es', label: 'Spanish', default: false },
          ],
        },
      ],
      translationsV2,
    });
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
            _id: 'admin',
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
          TestEmitSources.currentTenant,
          expect.objectContaining({
            contexts: expect.arrayContaining([
              expect.objectContaining({ values: { Search: 'Buscar' } }),
            ]),
            locale: 'es',
          })
        );
      });
    });

    describe.each([
      { title: 'V1', featureFlags: { v2Languages: false } },
      { title: 'V2', featureFlags: { v2Languages: true } },
    ])('api/translations/languages ($title)', ({ featureFlags }) => {
      describe('when successful', () => {
        let response: request.Response;
        let mockCalls: any[];

        const newSettings = expect.objectContaining({
          languages: [
            expect.objectContaining({ key: 'en', label: 'English', default: true }),
            expect.objectContaining({ key: 'es', label: 'Spanish', default: false }),
            expect.objectContaining({ key: 'zh', label: 'Chinese' }),
            expect.objectContaining({ key: 'ja', label: 'Japanese' }),
          ],
          mapStartingPoint: [{ lon: 6, lat: 46 }],
        });

        beforeAll(async () => {
          testingTenants.changeCurrentTenant({ featureFlags });
          DefaultTranslations.CONTENTS_DIRECTORY = `${__dirname}/test_contents/3`;

          iosocket.emit.mockReset();
          response = await request(app)
            .post('/api/translations/languages')
            .send([
              { key: 'zh', label: 'Chinese' },
              { key: 'ja', label: 'Japanese' },
            ]);
          mockCalls = iosocket.emit.mock.calls;
          await waitForExpect(() => {
            expect(mockCalls.length).toBe(4);
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
              TestEmitSources.currentTenant,
              {
                locale: 'zh',
                contexts: [
                  {
                    id: 'System',
                    label: 'User Interface',
                    type: 'Uwazi UI',
                    values: {
                      Search: 'Search',
                    },
                  },
                  {
                    id: 'contextID',
                    label: 'Template',
                    type: 'Entity',
                    values: { title: 'Template 1' },
                  },
                ],
              },
            ],
            [
              'translationsChange',
              TestEmitSources.currentTenant,
              {
                locale: 'ja',
                contexts: [
                  {
                    id: 'System',
                    label: 'User Interface',
                    type: 'Uwazi UI',
                    values: { Search: 'Search' },
                  },
                  {
                    id: 'contextID',
                    label: 'Template',
                    type: 'Entity',
                    values: { title: 'Template 1' },
                  },
                ],
              },
            ],
          ]);
        });

        it('should emit an updateSettings event', async () => {
          const eventCandidate = mockCalls.find(([eventName]) => eventName === 'updateSettings');
          expect(eventCandidate).toMatchObject([
            'updateSettings',
            TestEmitSources.currentTenant,
            newSettings,
          ]);
        });

        it('should emit a translationsInstallDone event', async () => {
          const expectedSource = featureFlags.v2Languages
            ? TestEmitSources.currentTenant
            : TestEmitSources.session;
          const eventCandidate = mockCalls.find(
            ([eventName]) => eventName === 'translationsInstallDone'
          );
          expect(eventCandidate).toMatchObject(['translationsInstallDone', expectedSource]);
        });
      });

      describe('when encountering an error', () => {
        let mockCalls: any[];
        jest.spyOn(console, 'error').mockImplementation(() => true);
        let response: request.Response;
        let errorMock: jest.SpyInstance;

        beforeAll(async () => {
          testingTenants.changeCurrentTenant({ featureFlags });
          DefaultTranslations.CONTENTS_DIRECTORY = `${__dirname}/test_contents/3`;
          iosocket.emit.mockReset();

          if (featureFlags.v2Languages) {
            errorMock = jest
              .spyOn(MongoSettingsDataSource.prototype, 'addLanguage')
              .mockImplementation(() => {
                throw new Error('error message');
              });
          } else {
            errorMock = jest.spyOn(settings, 'addLanguage').mockImplementation(() => {
              throw new Error('error message');
            });
          }

          response = await request(app)
            .post('/api/translations/languages')
            .send([{ key: 'ja', label: 'Japanese' }]);
          mockCalls = iosocket.emit.mock.calls;
        });

        afterAll(async () => {
          errorMock.mockRestore();
        });

        if (featureFlags.v2Languages) {
          it('should return a 500 as the error propagates through Express', async () => {
            expect(response.status).toBe(500);
          });
        } else {
          it('should still return a 204', async () => {
            expect(response).toHaveStatus(204);
          });

          it('should emit a translationsInstallError event', async () => {
            const eventCandidate = mockCalls[0];
            expect(eventCandidate).toMatchObject([
              'translationsInstallError',
              TestEmitSources.session,
              'error message',
            ]);
          });
        }
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
                id: 'System',
                label: 'User Interface',
                type: 'Uwazi UI',
                values: {
                  Search: 'Buscar traducida',
                },
              },
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
          TestEmitSources.currentTenant,
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
    describe.each([
      { title: 'V1', featureFlags: { v2Languages: false } },
      { title: 'V2', featureFlags: { v2Languages: true } },
    ])('api/translations/languages ($title)', ({ featureFlags }) => {
      describe('when successful', () => {
        let response: request.Response;

        beforeAll(async () => {
          testingTenants.changeCurrentTenant({ featureFlags });
          iosocket.emit.mockReset();
          await testingEnvironment.setFixtures({
            settings: [
              {
                languages: [
                  { key: 'en', label: 'English', default: true },
                  { key: 'es', label: 'Spanish', default: false },
                ],
              },
            ],
          });
          response = await request(app).delete('/api/translations/languages?key=es').send();
          await waitForExpect(() => {
            expect(
              iosocket.emit.mock.calls.find(([eventName]) => eventName === 'translationsDeleteDone')
            ).toBeDefined();
          });
        });

        it('should return a 204', async () => {
          expect(response).toHaveStatus(204);
        });

        it('should emit an updateSettings event', async () => {
          await waitForExpect(() => {
            const eventCandidate = iosocket.emit.mock.calls.find(
              ([eventName]) => eventName === 'updateSettings'
            );
            expect(eventCandidate).toMatchObject([
              'updateSettings',
              TestEmitSources.currentTenant,
              {
                languages: [
                  {
                    default: true,
                    key: 'en',
                    label: 'English',
                  },
                ],
                mapStartingPoint: [{ lat: 46, lon: 6 }],
              },
            ]);
          });
        });

        it('should emit a translationsDelete event', async () => {
          await waitForExpect(() => {
            const eventCandidate = iosocket.emit.mock.calls.find(
              ([eventName]) => eventName === 'translationsDelete'
            );
            expect(eventCandidate).toMatchObject([
              'translationsDelete',
              TestEmitSources.currentTenant,
              'es',
            ]);
          });
        });

        it('should emit a translationsDeleteDone event', async () => {
          await waitForExpect(() => {
            const expectedSource = featureFlags.v2Languages
              ? TestEmitSources.currentTenant
              : TestEmitSources.session;
            const eventCandidate = iosocket.emit.mock.calls.find(
              ([eventName]) => eventName === 'translationsDeleteDone'
            );
            expect(eventCandidate).toMatchObject(['translationsDeleteDone', expectedSource]);
          });
        });
      });

      describe('when encountering an error', () => {
        let mockCalls: any[];
        let response: request.Response;
        let settingsDeleteLanguageMock: jest.SpyInstance;

        beforeAll(async () => {
          testingTenants.changeCurrentTenant({ featureFlags });
          DefaultTranslations.CONTENTS_DIRECTORY = `${__dirname}/test_contents/3`;
          iosocket.emit.mockReset();

          if (featureFlags.v2Languages) {
            settingsDeleteLanguageMock = jest
              .spyOn(MongoSettingsDataSource.prototype, 'deleteLanguage')
              .mockImplementation(() => {
                throw new Error('error message');
              });
          } else {
            settingsDeleteLanguageMock = jest.spyOn(settings, 'deleteLanguage');
            settingsDeleteLanguageMock.mockImplementation(() => {
              throw new Error('error message');
            });
          }

          response = await request(app).delete('/api/translations/languages?key=es').send();
          mockCalls = iosocket.emit.mock.calls;

          if (!featureFlags.v2Languages) {
            await waitForExpect(() => {
              expect(mockCalls.length).toBe(1);
            });
          }
        });

        afterAll(async () => {
          settingsDeleteLanguageMock.mockRestore();
        });

        if (featureFlags.v2Languages) {
          it('should return a 500 as the error propagates through Express', async () => {
            expect(response.status).toBe(500);
          });
        } else {
          it('should still return a 204', async () => {
            expect(response.status).toBe(204);
          });

          it('should emit a translationsDeleteError event', async () => {
            const eventCandidate = mockCalls[0];
            expect(eventCandidate).toMatchObject([
              'translationsDeleteError',
              TestEmitSources.session,
              'error message',
            ]);
          });
        }
      });

      describe('when the language is still being installed', () => {
        it('should return 409 and not start the delete operation', async () => {
          testingTenants.changeCurrentTenant({ featureFlags });
          await testingEnvironment.db
            .getCollection('settings')!
            .updateOne({ 'languages.key': 'es' }, { $set: { 'languages.$.installing': true } });

          const response = await request(app).delete('/api/translations/languages?key=es').send();

          expect(response.status).toBe(409);
        });
      });

      describe('when the language does not exist', () => {
        it('should return 409', async () => {
          testingTenants.changeCurrentTenant({ featureFlags });
          const response = await request(app).delete('/api/translations/languages?key=fr').send();

          expect(response.status).toBe(409);
        });
      });
    });
  });
});
