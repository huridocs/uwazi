import { createError, validation } from 'api/utils';
import settings from 'api/settings';
import entities from 'api/entities';
import pages from 'api/pages';
import { CSVLoader } from 'api/csv';
import { uploadMiddleware } from 'api/files';
import { sequentialPromises } from 'shared/asyncUtils';
import { LanguageISO6391Schema, languageSchema } from 'shared/types/commonSchemas';
import { LanguageISO6391, LanguageSchema } from 'shared/types/commonTypes';
import { Application, Request } from 'express';
import { UITranslationNotAvailable } from 'api/i18n/defaultTranslations';
import needsAuthorization from '../auth/authMiddleware';
import translations from './translations';
import { upsertTranslationEntries } from './v2_support';

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
  try {
    await translations.importPredefined(language.key);
  } catch (error) {
    if (!(error instanceof UITranslationNotAvailable)) {
      throw error;
    }
  }
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
    '/api/translationsV2',
    needsAuthorization(),
    validation.validateRequest({
      type: 'object',
      properties: {
        body: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              language: { type: 'string' },
              key: { type: 'string' },
              value: { type: 'string' },
              context: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  label: { type: 'string' },
                  type: { type: 'string' },
                },
                required: ['id', 'label', 'type'],
              },
            },
            required: ['language', 'key', 'value', 'context'],
          },
        },
      },
      required: ['body'],
    }),
    async (req, res) => {
      await upsertTranslationEntries(req.body);
      const response = await translations.get();
      response.forEach(language => {
        req.sockets.emitToCurrentTenant('translationsChange', language);
      });
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
      addLanguages(languages, req).catch((error: Error) => {
        req.emitToSessionSocket('translationsInstallError', error.message);
        // eslint-disable-next-line no-console
        console.error(error);
      });
      res.status(204).json('ok');
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
      deleteLanguage(key, req).catch((error: Error) => {
        req.emitToSessionSocket('translationsDeleteError', error.message);
        // eslint-disable-next-line no-console
        console.error(error);
      });
      res.status(204).json('ok');
    }
  );
};

export { addLanguage };
