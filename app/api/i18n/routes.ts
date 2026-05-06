/* eslint-disable max-lines */
import type { Application, Request } from 'express';

import { createError, validation } from '#api/utils/index.js';
import settings from '#api/settings/index.js';
import entities from '#api/entities/index.js';
import pages from '#api/pages/index.js';
import { CSVLoader } from '#api/csv/index.js';
import { uploadMiddleware } from '#api/files/index.js';
import { sequentialPromises } from '#shared/asyncUtils.js';
import { LanguageISO6391Schema, languageSchema } from '#shared/types/commonSchemas.js';
import { LanguageISO6391, LanguageSchema } from '#shared/types/commonTypes.js';
import { UITranslationNotAvailable } from '#api/i18n/defaultTranslations.js';
import { ArrayUtils } from '#api/common.v2/utils/Array.js';
import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { EntityPreviewBatchHandler } from '#api/core/infrastructure/jobs/EntityPreviewBatchHandler.js';
import { tenants } from '#api/tenants/tenantContext.js';
import { AddLanguageUseCaseFactory } from '#api/core/infrastructure/factories/AddLanguageUseCaseFactory.js';
import needsAuthorization from '../auth/authMiddleware.js';
import translations from './translations.js';

const dispatchEntityPreviewJobs = async (languageKey: LanguageISO6391) => {
  const transactionManager = TransactionManagerFactory.default();
  const filesDS = FilesDataSourceFactory.default();
  const thumbnails = await filesDS.getThumbnailsByLanguage(languageKey).all();
  const sharedIds = [...new Set(thumbnails.map(t => t.entity))];
  if (sharedIds.length === 0) return;
  const chunks = ArrayUtils.splitInChunks(sharedIds, 100);
  const dispatcher = DefaultDispatcher(tenants.current().name, transactionManager);
  await dispatcher.dispatchMany(async dispatch =>
    chunks.forEach(chunk => dispatch(EntityPreviewBatchHandler, { languageKey, sharedIds: chunk }))
  );
};

const importPredefinedIfAvailable = async (key: LanguageISO6391) => {
  try {
    await translations.importPredefined(key);
  } catch (error) {
    if (!(error instanceof UITranslationNotAvailable)) {
      throw error;
    }
  }
};

const addLanguage = async (language: LanguageSchema) => {
  const newSettings = await settings.addLanguage(language);
  const addedTranslations = await translations.addLanguage(language.key);
  const newTranslations = addedTranslations
    ? {
        ...addedTranslations,
        contexts: translations.prepareContexts(addedTranslations.contexts),
      }
    : addedTranslations;
  await entities.addLanguage(language.key);
  await pages.addLanguage(language.key);
  await dispatchEntityPreviewJobs(language.key);
  await importPredefinedIfAvailable(language.key);
  return { newSettings, newTranslations };
};

async function addLanguages(languages: LanguageSchema[], req: Request) {
  let newSettings;
  let newTranslations;
  await sequentialPromises(languages, async (language: LanguageSchema) => {
    ({ newSettings, newTranslations } = await addLanguage(language));
    req.sockets.emitToCurrentTenant('translationsChange', newTranslations);
  });
  req.sockets.emitToCurrentTenant('updateSettings', newSettings);
  req.emitToSessionSocket('translationsInstallDone');
}

async function deleteLanguage(key: LanguageISO6391, req: Request) {
  const [newSettings] = await Promise.all([
    settings.deleteLanguage(key),
    translations.removeLanguage(key),
    entities.removeLanguage(key),
    pages.removeLanguage(key),
  ]);

  req.sockets.emitToCurrentTenant('updateSettings', newSettings);
  req.sockets.emitToCurrentTenant('translationsDelete', key);
  req.emitToSessionSocket('translationsDeleteDone');
}

type TranslationsRequest = Request & { query: { context: string } };

// eslint-disable-next-line max-statements
export default (app: Application) => {
  app.get(
    '/api/translations',
    validation.validateRequest({
      type: 'object',
      properties: {
        query: {
          type: 'object',
          properties: {
            context: { type: 'string' },
          },
        },
      },
    }),
    async (req: TranslationsRequest, res) => {
      const { context } = req.query;
      const response = await translations.get({ context });

      res.json({ rows: response });
    }
  );

  app.get('/api/languages', async (_req, res) => {
    res.json(await translations.availableLanguages());
  });

  app.post(
    '/api/translations/import',
    needsAuthorization(),
    uploadMiddleware(),
    validation.validateRequest({
      type: 'object',
      properties: {
        body: {
          type: 'object',
          properties: {
            context: { type: 'string' },
          },
          required: ['context'],
        },
      },
    }),

    async (req, res, next) => {
      if (!req.file) throw new Error('File is not available on request object');
      try {
        const { context } = req.body;
        const loader = new CSVLoader();
        const response = await loader.loadTranslations(req.file.path, context);
        response.forEach(translation => {
          req.sockets.emitToCurrentTenant('translationsChange', translation);
        });
        res.json(response);
      } catch (e) {
        next(e);
      }
    }
  );

  app.post(
    '/api/translations',
    needsAuthorization(),
    validation.validateRequest({
      type: 'object',
      properties: {
        body: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            __v: { type: 'number' },
            locale: { type: 'string' },
            contexts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                  id: { type: 'string' },
                  label: { type: 'string' },
                  type: { type: 'string' },
                  values: { type: 'object', additionalProperties: { type: 'string' } },
                },
              },
            },
          },
          required: ['locale', 'contexts'],
        },
      },
      required: ['body'],
    }),

    async (req, res) => {
      const { locale } = await translations.save(req.body);
      const [response] = await translations.get({ locale });
      req.sockets.emitToCurrentTenant('translationsChange', response);
      res.json(response);
    }
  );

  app.post(
    '/api/translations/populate',
    needsAuthorization(),
    validation.validateRequest({
      type: 'object',
      properties: {
        body: {
          type: 'object',
          properties: {
            locale: { type: 'string' },
          },
          required: ['locale'],
        },
      },
      required: ['body'],
    }),

    async (req, res, next) => {
      const { locale } = req.body;
      try {
        await translations.importPredefined(locale);
        res.json(await translations.get({ locale }));
      } catch (error) {
        if (error instanceof UITranslationNotAvailable) {
          next(createError(error, 422));
        }
        next(error);
      }
    }
  );

  app.post(
    '/api/translations/setasdeafult',
    needsAuthorization(),
    validation.validateRequest({
      type: 'object',
      properties: {
        body: {
          type: 'object',
          properties: {
            key: LanguageISO6391Schema,
          },
          required: ['key'],
        },
      },
      required: ['body'],
    }),

    async (req, res) => {
      const response = await settings.setDefaultLanguage(req.body.key);
      req.sockets.emitToCurrentTenant('updateSettings', response);
      res.json(response);
    }
  );

  app.post(
    '/api/translations/languages',
    needsAuthorization(),
    validation.validateRequest({
      type: 'object',
      properties: {
        body: { type: 'array', items: languageSchema },
      },
    }),

    async (req, res) => {
      const languages = req.body as LanguageSchema[];

      if (tenants.current().featureFlags?.v2AddLanguage) {
        (async () => {
          try {
            await AddLanguageUseCaseFactory.default().execute({ languages });
            for (const language of languages) {
              // eslint-disable-next-line no-await-in-loop
              const [newTranslations] = await translations.get({ locale: language.key });
              req.sockets.emitToCurrentTenant('translationsChange', newTranslations);
            }
            const newSettings = await settings.get();
            req.sockets.emitToCurrentTenant('updateSettings', newSettings);
            // translationsInstallDone is emitted by CloneLanguageEntitiesJob
          } catch (error: any) {
            req.emitToSessionSocket('translationsInstallError', error.message);
            // eslint-disable-next-line no-console
            console.error(error);
          }
        })();
      } else {
        addLanguages(languages, req).catch((error: Error) => {
          req.emitToSessionSocket('translationsInstallError', error.message);
          // eslint-disable-next-line no-console
          console.error(error);
        });
      }

      res.sendStatus(204);
    }
  );

  type DeleteTranslationRequest = Request & { query: { key: LanguageISO6391 } };

  app.delete(
    '/api/translations/languages',
    needsAuthorization(),
    validation.validateRequest({
      type: 'object',
      properties: {
        key: LanguageISO6391Schema,
      },
    }),
    async (req: DeleteTranslationRequest, res) => {
      const { key } = req.query;

      const currentSettings = await settings.get();
      const language = currentSettings.languages?.find(l => l.key === key);
      if (language?.installing) {
        res.status(409).json({ error: 'Language is still being installed' });
        return;
      }

      deleteLanguage(key, req).catch((error: Error) => {
        req.emitToSessionSocket('translationsDeleteError', error.message);
        // eslint-disable-next-line no-console
        console.error(error);
      });
      res.sendStatus(204);
    }
  );
};

export { addLanguage };
